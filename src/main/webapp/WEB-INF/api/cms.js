/*
 * Copyright (c) 2012, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
/**
 * @module api/cms
 *
 * @fileOverview This module enables a caching layer between the web clients and the Zocia platform
 * for multilingual text and binary assets.
 *
 * Background
 *
 * Each piece of CMS content is a record called a "resource object" which contains properties like title,
 * description, thumbnail url, author, date created and modified, etc. We look up CMS content in Zocia
 * using two properties which identify a unique record, "key" and "locale". It is important to recognize
 * that the CMS is multilingual and the "key" designates a particular segment of content, but until the
 * "locale" is specified we won't know which specific content record is being requested.
 *
 * It is also worth noting that the "locale" property is a best match situation. For example, you may be
 * requesting content with a local of 'fr-CA" (French Canadian), but you may get the record for "fr" (French)
 * because the more specific locale could not be found.
 *
 * While the Zocia platform is used for all CMS persistence (using its 'resources' collection),
 * all GC clients will use this module's services for basic CRUD functionality relating to CMS
 * content.
 *
 * There are two unique keys used for each CMS fragment. First, the primary key is _id which holds
 * a UID value which allows any specific piece of content to be referenced. While this is handy, for
 * some update functionality, we rarely use it because of our need to beforem a best match search on
 * the 'locale' property.
 *
 * key - A unique value used to identify the general content block (i.e. intro). The key does not
 *       uniquely identify a single record in the database since a block will have separate records
 *       for each language the content uses.
 * locale - A string representing the language of the content (ie en-GB).
 *
 * When considered together, the <key.locale> composite results in the location of a specific
 * record in the database. Keep in mind that the locale is not always an exact match. For example,
 * if the database has records in 'es', 'en' and 'en-GB', a search for a locale of 'en-ZA' will
 * result in the "downgraded" record for 'en'. In fact, a default locale is configured into the
 * wen server resulting in the default locale being returned whenever a language code cannot be
 * located.
 *
 * API
 *
 * GET /api/cms/:key[?format=<locale>
 *     :key - a unique id that describes the content. <id>[@<locale>]
 *     [Accept-Language] - The header value is used to determine the locale used to retrieve
 *         the appropriate record from the cms. Locale can also be specified as a parameter
 *         which will take precedence over the header value.
 *
 *     Note: The locale is extracted in this precedence.
 *       1. The use of a suffix on the key delimited with an @ symbol. (ie /<key>@fr-CA)
 *       2. The use of a 'format' parameter. (ie /<key>?format=fr-CA)
 *       3. If the header 'x-cms-no-locale' is present, no locale is used. (middleware makes sure of this.)
 *       4. The use of the 'Accept-Language' header in the request.
 *
 * POST /api/cms/
 *     [Accept-Language] - The header value is used to determine the locale used to create
 *         the appropriate record from the cms. If the 'locale' property is included in the
 *         JSON record, the property will take precedence.
 *     [Body] - A JSON object representing the CMS content to create.
 *
 * PUT /api/cms/:key
 *     :key - a unique id that describes the content.
 *     [Body] - A JSON object representing the CMS content to update. The JSON object need
 *         not include all required attributes of a resource object.
 *
 * DELETE /api/cms/:key
 *     :key - a unique id that describes the content.
 *     Note: Deleting a key, removes all content records with that key (meaning all locales).
 *
 *
 * Architecture
 *
 * The GC web server maintains an embeddable version of Hazelcast. Hazelcast provides an efficient
 * clustered cache layer which is backed be a persistence tier. If Hazelcast is asked for a key that
 * is not yet in its store, it will query a back-end process for the value of the key. Likewise, if
 * a new value is added to Hazelcast, it will push the value to the back-end process for long term
 * storage.
 *
 * As needed, we may spin up two, three or more instances of the GC web server. The embedded Hazelcast
 * engines will auto-cluster and begin to partition key/value data between themselves. Once one server
 * instance receives a key/value, the value is immediately shared amongst all servers reducing load on
 * the Zocia instance. This also means that each update to CMS data is immediately propogated to the
 * other Hazelcast nodes on the network. The next page refresh by the client will include the newest
 * values always.
 *
 * Inefficiencies
 *
 * There is a slight inefficiency caused by the specificity of the locale property. Imagine these
 * three incoming requests:
 *
 *     GET /api/cms/intro  <Accept-Language = en>
 *     GET /api/cms/intro  <Accept-Language = en-GB>
 *     GET /api/cms/intro  <Accept-Language = en-US>
 *
 *  Suppose the CMS contains only the 'en' locale. All three requests will receive the expected result
 *  for the 'en' locale only, however the cache will store the same CMS record for each composite key.
 *  Therefore there will be the same JSON object stored for each of these keys:
 *
 *      intro/en: {...intro json for en locale...}
 *      intro/en-GB: {...intro json for en locale...}
 *      intro/en-US: {...intro json for en locale...}
 *
 *  todo: One way to circumvent this is to store only the key for each content object, and when there
 *  are multiple locales for a single key, they are put into a sub-map. This puts the locale-matching
 *  logic into this class, but avoids the issues with repetitive storage. It also complicates the
 *  persistence layer forcing additional writes to the persistence tier. Probably not an ideal tradeoff.
 *
 */

var log = require('ringo/logging').getLogger(module.id);
var store = require('store-js');
var {json} = require('utility/extendedResponse');
var {getConfigParam} = require('utility/getUrls');
var {handleUpload, S3PassthroughStream} = require('utility/upload');

var {Application} = require('stick');
var app = exports.app = Application();
app.configure('route', locale);

// todo: pull from a truly global location
var INDEX = 'gc';

// It is important to realize that this map has nothing to do with the map of resources stored
// in the Zocia system; save for its name. This is a clustered shared hazelcast map used within
// this server.
var map = store.getMap(INDEX, 'resources');

/**
 * GET /api/cms/:key[?format=<locale>
 *     :key - a unique id that describes the content. <id>[@<locale>]
 *     [Accept-Language] - The header value is used to determine the locale used to retrieve
 *         the appropriate record from the cms. Locale can also be specified as a parameter
 *         which will take precedence over the header value.
 *
 *     Note: The locale is extracted in this precedence.
 *       1. The use of a suffix on the key delimited with an @ symbol. (ie /<key>@fr-CA)
 *       2. The use of a 'format' parameter. (ie /<key>?format=fr-CA)
 *       3. If the header 'x-cms-no-locale' is present, no locale is used. (middleware makes sure of this.
 *       4. The use of the 'Accept-Language' header in the request.
 */
app.get('/:key', function (req, key) {
    var locale = req.params.locale || req.locale || null;

    // Locale specified as a suffix to the key takes precedence
    var keyParts = key.split('@');
    if (keyParts > 1) locale = keyParts[1];

    var lookup = key;
    if (locale) {
        lookup += '@' + locale;
    }

    var resource = map.get(lookup);

    if(resource === null) {
        log.error("Error retrieving resource with key: "+lookup);
        return json({'error': true});
    }
    // In order for the map to work, we need to use the locale of the resource and not the lookup
    // when we store the resource in the map.
    map.evict(lookup);
    var newLookup = key + '@' + resource.locale;
    map.put(newLookup, resource);

    log.info('Fetching key {} and locale {}: lookup: {}, value: {}', key, locale, newLookup, JSON.stringify(resource));
    return json(resource);
});


/**
 * POST /api/cms/
 *     [Accept-Language] - The header value is used to determine the locale used to create
 *         the appropriate record from the cms. If the 'locale' property is included in the
 *         JSON record, the property will take precedence.
 *     [Body] - A JSON object representing the CMS content to create.
 *
 *     Note: Does not return a location header.
 */
app.post('/', function (req) {
    log.debug('POST /api/cms, locale: {}', req.locale);

    // Get the JSON object holding the payload
    var resource = req.postParams;

    if (!resource) return json({message: 'Invalid request, must provide JSON resource in body.' }, 400,
        {"Content-Type": 'text/html'});

    if (!resource.locale) {
        resource.locale = req.locale;
    }

    // Resource has several required properties
    if (!resource.locale) return json({message: 'Invalid request, must provide a locale.' }, 400,
        {"Content-Type": 'text/html'});
    if (!resource.key) return json({message: 'Invalid request, must provide a key.' }, 400,
        {"Content-Type": 'text/html'});

    // Write the new resource into the map using the key/locale as the map key
    var lookup = resource.key + '@' + resource.locale;
    var mapResources = store.getMap(INDEX, "resources");
    mapResources.put(lookup, resource);

    // Cannot provide Location header as of yet (no _id field known).
    return json(resource, 201, {});
});


/**
 *
 * PUT /api/cms/:key
 *     :key - a unique id that describes the content.
 *     [Body] - A JSON object representing the CMS content to update. The JSON object need
 *         not include all required attributes of a resource object.
 *
 */
app.put('/:id', function (req, id) {
    log.debug('PUT /api/cms, locale: {}', req.locale);

    // Get the JSON object holding the payload
    var resource = req.postParams;

    if (!resource) return json({message: 'Invalid request, must provide JSON resource in body.' }, 400,
        {"Content-Type": 'text/html'});

    // Resource has several required properties
    if (!resource.locale) return json({message: 'Invalid request, must provide a locale.' }, 400,
        {"Content-Type": 'text/html'});
    if (!resource.key) return json({message: 'Invalid request, must provide a key.' }, 400,
        {"Content-Type": 'text/html'});

    // Write the new resource into the map using the key/locale as the map key
    var lookup = resource.key + '@' + resource.locale;
    var mapResources = store.getMap(INDEX, "resources");
    mapResources.put(lookup, resource);

    log.info('Updated the HZ map, key: {}, resource: {}', lookup, JSON.stringify(resource));

    return json(resource, 204, {});
});


/**
 * @function
 * @name POST /upload/image
 * @description Uploads images to S3
 *
 * @param {JsgiRequest} request
 * @returns {JsgiResponse} A JSON string with upload results
 */
app.post('/upload/image', function (req) {
    try {
        // All uploaded cms imagery will be stored with a unique key and in the 'cms' folder.
        var key = 'cms/' + store.generateId(false);

        // Read in the configuration parameters for the S3 upload
        var s3AccessKey = getConfigParam(req, 's3AccessKey');
        var s3SecretKey = getConfigParam(req, 's3SecretKey');
        var s3Bucket = getConfigParam(req, 's3Bucket');

        // Create a stream factory that will write the request's input stream to S3 as efficiently as possible.
        var s3Lib = require('utility/s3');
        var s3 = s3Lib.connect(s3AccessKey, s3SecretKey);
        var s3Stream = new S3PassthroughStream(s3, s3Bucket, key);

        // Handle the upload
        var result = handleUpload(req, s3Stream.streamFactory);

        // It can take some time for files to be uploaded to S3
        s3Stream.waitForDone();

        // Uploads to S3 can fail
        if (!result.file) throw {
            message: 'Failed to upload file to Amazon S3.'
        };

        // Get the S3 location for the new file and return it in the result
        result.file.uri = s3Stream.getURI();
        return json(result);
    } catch (e) {
        return json({
            status: e.status || 500,
            message: e.message
        }, e.status || 500);
    }
});


/**
 * Middleware component for Stick to inject a locale property based on the Accept-Language header.
 *
 * Note;
 * @return {Function}
 */
function locale(next) {
    return function (req) {
        Object.defineProperty(req, "locale", {
            get: function () {
                if (!!req.headers['x-cms-no-locale']) return null;

                var locale = req.env.servletRequest.getLocale();
                if (!locale) return 'en';

                return locale;
            }
        });

        return next(req);
    }
}