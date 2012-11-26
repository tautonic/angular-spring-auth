/*
 * Copyright (c) 2012, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
/**
 * @module api/upload
 *
 * @fileOverview This module enables the uploading of a file from the client.
 *
 */

var log = require('ringo/logging').getLogger(module.id);

var {Application} = require('stick');
var app = exports.app = Application();
app.configure('route');

var fileUpload = require('ringo/utils/http');
var httpclient = require('ringo/httpclient');
var {encode} = require('ringo/base64');


/**
 * Uploads a file from the client and into memory.
 *
 * TempFileFactory Response:
 * {
 *     "name": "headshot_02.jpg",
 *     "file": {
 *         "name": "file",
 *         "filename": "headshot_02.jpg",
 *         "contentType": "image/jpeg",
 *         "tempfile": "/var/folders/temp/ringo-upload-8730673135038948527.tmp"
 *     }
 * }
 *
 * BufferFactory Response:
 * {
 *     "name": "headshot_02.jpg",
 *     "file": {
 *         "name": "file",
 *         "filename": "headshot_02.jpg",
 *         "contentType": "image/jpeg",
 *         "value": {}
 *     }
 * }
 *
 * S3StreamFactory Response:
 * {
 *     file: {
 *         name: "file",
 *         filename: "AppleJim.jpg",
 *         contentType: "image/jpeg",
 *         url: "http://s3.amazonaws.com/qa.zocia.upload.files/123b123cc8840a0c9d.jpg"
 *     }
 * }
 *
 * @param req
 * @return {*}
 */
var handleUpload = exports.handleUpload = function (req, streamFactory) {
    // Verify the content type is appropriate for file upload
    var contentType = req.env.servletRequest.getContentType();
    if (!fileUpload.isFileUpload(contentType)) throw {
        status: 400,
        message: 'Content type for file upload POST must be multipart/form-data and not ' + contentType
    };

    var encoding = req.env.servletRequest.getCharacterEncoding();
    var params = fileUpload.parseFileUpload(req, {}, encoding, streamFactory);

    log.info('File uploaded: {}', JSON.stringify(params, null, 4));
    delete params.name;

    return params;
};


/**
 * Todo: Work in progress -- Do not use
 * A stream factory which will push a file to Zocia for final storage.
 * The purpose of our passthru stream is we don't store much data in memory as a file
 * is uploaded. Whatever bytes come in, are immediately written back out. In this case
 * they are written out to Zocia server.
 *
 * Zocia upload is performed using a PUT request.
 *
 * @param {java.io.InputStream} inputStream A Java input stream
 * @constructor
 */
function ZociaPassthroughStream (putUrl, index, username, password) {

    var URI = null;
    var params = {};
    var curParam = null;
    var thread, exchange;

    // Return something that supports the write(buffer, position, end) and close()
    function streamFactory(data, encoding) {

        var bytesWritten = 0;

        log.info('Data contents: ' + JSON.stringify(data, null, 4));
        var filename = params.name;
        var size = parseInt(params.filesize);

        curParam = data.name;

        if (data.name === 'file') {
            curParam = null;

            // Create the "output" stream which provides the PFU process with it's write() functionality
            var output = new java.io.PipedOutputStream();

            // Create the input stream for S3 and "wire" the input and output streams together, so everything written
            var input = new java.io.PipedInputStream(output);

            // Create HTTP PUT request to stream input to Zocia
            var opts = {
                url: putUrl,
                username: username,
                password: password,
                headers: {
                    'x-rt-index': 'gc',
                    'x-rt-upload-name': data.filename,
                    'x-rt-upload-content-type': data.contentType
                },
                data: input,
                method: 'PUT',
                async: true
            };

            // Create a thread to run the Zocia put inside of
            var r = new java.lang.Runnable({
                run: function() {
                    log.info('Initiating HTTP request to {}', putUrl);
                    exchange = httpclient.request(opts);
                    log.info('Content: {}', exchange.content);
                }
            }) ;
            thread = new java.lang.Thread(r, 'ZociaPassThru');
            thread.start();
        }

        function write(buffer, position, end) {
            bytesWritten += end - position;
            log.info('Writing to output stream: ' + bytesWritten + ' bytes written, params: ' + JSON.stringify(params, null, 4));
            if (output) {
                output.write(buffer, position, end - position);
            } else {
                // Hacky
                var bytes = buffer.slice(position, end).toByteArray();
                var s = new java.lang.String(bytes).toString();
                params[curParam] = s;
            }
        }

        function close() {
            if (output) {
                log.info('Closing the output stream.');
                output.close();
            }
        }

        function closeInput() {
            if (input) {
                log.info('Closing the input stream.');
                input.close();
            }
            if (thread) {
                log.info('Interrupting the upload write thread.');
                thread.interrupt();
            }
        }

        return {
            write: write,
            close: close,
            closeInput: closeInput
        }
    }

    function waitForDone() {
        return exchange.waitForDone();
    }

    function getURI() {
        return URI;
    }

    return {
        streamFactory: streamFactory,
        getURI: getURI,
        waitForDone: waitForDone
    }
}


/**
 * A stream factory used by file upload process which will call streamFactory() when it
 * is ready for a stream to be created.
 *
 * ParseFileUpload (PFU) will call the streamFactory method when it wishes to create a
 * stream factory implementation. The factory is passed a data object and an encoding
 * value. The typical data contents will be:
 *
 *
 * The resulting "stream" will have to implement only two methods such as:
 *     write(buffer, position, end);
 *     close();
 *
 * The purpose of our passthru stream is we don't store much data in memory as a file
 * is uploaded. Whatever bytes come in, are immediately written back out. In this case
 * they are written out to Amazon S3.
 *
 *
 * @param {java.io.InputStream} inputStream A Java input stream
 * @constructor
 */
var S3PassthroughStream = exports.S3PassthroughStream = function  (s3, bucketName, key) {

    var URI = null;
    var params = {};
    var curParam = null;
    var thread;

    log.info('Initializing S3PassthroughStream!');


    // Return something that supports the write(buffer, position, end) and close()
    function streamFactory(data, encoding) {

        var bytesWritten = 0;

        // When PFU calls streamFactory, the data object will contain some values that are important to the S3 put
        log.info('Data contents: ' + JSON.stringify(data, null, 4));
        var filename = params.name;
        var size = parseInt(params.filesize);

        curParam = data.name;

        if (data.name === 'file') {
            curParam = null;
            log.info('Recognized binary upload segment');

            // Create the "output" stream which provides the PFU process with it's write() functionality
            var output = new java.io.PipedOutputStream();

            // Create the input stream for S3 and "wire" the input and output streams together, so everything written
            var input = new java.io.PipedInputStream(output);

            // Create a thread to run the S3 put inside of. (We don't want S3 to block the file upload process).
            var r = new java.lang.Runnable({
                run: function() {
                    log.info('Starting S3 PUT process, params: {}, data: {}',
                        JSON.stringify(params), JSON.stringify(data));
                    if (!key) key = filename;
                    URI = s3.put(bucketName, key, input, size, data.contentType);
                }
            }) ;
            thread = new java.lang.Thread(r, 'S3PassThru');
            thread.start();

            log.info('S3 PUT process initiated? completed?');
        }

        function write(buffer, position, end) {
            bytesWritten += end - position;
            log.info('Writing to output stream: ' + bytesWritten + ' bytes written, params: ' + JSON.stringify(params, null, 4));
            if (output) {
                output.write(buffer, position, end - position);
            } else {
                // Hacky
                var bytes = buffer.slice(position, end).toByteArray();
                var s = new java.lang.String(bytes).toString();
                params[curParam] = s;
            }
        }

        function close() {
            if (output) {
                log.info('Closing the output stream.');
                output.close();
            }
        }

        function closeInput() {
            if (input) {
                log.info('Closing the input stream.');
                input.close();
            }
            if (thread) {
                log.info('Interrupting the S3 thread.');
                thread.interrupt();
            }
        }

        return {
            write: write,
            close: close,
            closeInput: closeInput
        }
    }

    function waitForDone() {
        while (!URI) {
            java.lang.Thread.sleep(1000);
        }
        return URI;
    }

    function getURI() {
        return URI;
    }

    return {
        streamFactory: streamFactory,
        getURI: getURI,
        waitForDone: waitForDone
    }
}

function _generateBasicAuthorization(username, password) {
    var header = username + ":" + password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}

