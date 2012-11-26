/*
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
var log = require('ringo/logging').getLogger(module.id);

var ACL = Packages.com.amazonaws.services.s3.model.CannedAccessControlList;
var {PutObjectRequest} = Packages.com.amazonaws.services.s3.model;

log.info('Initializing s3');

exports.connect = function(key, secret) {
    var credentials = new Packages.com.amazonaws.auth.BasicAWSCredentials(key, secret);
    var s3Svc = new Packages.com.amazonaws.services.s3.AmazonS3Client(credentials);

    function listBuckets() {
        var result = [];
        var buckets = s3Svc.listBuckets().iterator();
        while(buckets.hasNext()) {
            var bucket = buckets.next();
            result.push(bucket);
        }
        return result;
    }

    /**
     * Puts a file into S3 accessible via the provided key value in the bucket passed in. The ACL
     * for these files is defaulted to PublicRead, although that can be superceded if needed.
     *
     * @param bucket
     * @param key
     * @param inputStream
     * @param size
     * @param acl {CannedAccessControlList} optional field to specify the access policy (defaults to public-read)
     */
    function put(bucket, key, inputStream, size, contentType, acl) {
        // Set a default ACL of not supplied
        if (!acl) acl = ACL.PublicRead;

        log.info('Storing file in bucket: ' + bucket + ', key: ' + key + ', size: ' + size + ', acl: ' + acl);

        // Set up the metadata object. Note: this is required when we are using input streams
        var s3meta = new Packages.com.amazonaws.services.s3.model.ObjectMetadata();
        if (size) s3meta.setContentLength(size);
        if (contentType) s3meta.setContentType(contentType);

        var request = new PutObjectRequest(bucket, key, inputStream, s3meta).withCannedAcl(acl);

        // Write to S3
        try {
            s3Svc.putObject(request);
            return 'http://s3.amazonaws.com/' + bucket + '/' + key;
        } catch(e) {
            log.error('Error while saving file: ' + e, e);
            return null;
        }
    }

    var result = {
        put: put
    };

    Object.defineProperty(result, 'buckets', {
        get: function() {
            return listBuckets();
        }
    });

    return result;
};
