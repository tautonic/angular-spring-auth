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
 * While the Zocia platform is used for all CMS persistence (using its 'resources' collection),
 * all GC clients will use this module's services for basic CRUD functionality relating to CMS
 * content.
 *
 * There are two unique keys used for each CMS fragment. First, the primary key is _id which holds
 * a UID value which allows any specific piece of content to be referenced. While this is handy
 * for some functionality, we will not make use of it. Instead, we will use the composite key formed
 * through a combination of the 'key' property and the 'locale' property.
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
 *       3. If the header 'x-cms-no-locale' is present, no locale is used. (middleware makes sure of this.
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

/********************
 Requires
 *********************/

var {Application} = require('stick');
var store = require('store-js');
var {json} = require('utility/extendedResponse');
var log = require( 'ringo/logging' ).getLogger( module.id );


/********************
 Global Vars
 *********************/
var app = exports.app = Application();
app.configure('route', locale);

// todo: pull from a truly global location
var INDEX = 'gc';

// It is important to realize that this map has nothing to do with the map of resources stored
// in the Zocia system; save for its name.
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

    log.info('Fetching key {} and locale {}: lookup: {}', key, locale, lookup);
    return json(map.get(lookup));
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
app.put('/:id', function(req, id) {
    log.debug('POST /api/cms, locale: {}', req.locale);

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

    return json(resource, 204, {});
});

/**
 * Middleware component for Stick to inject a locale property based on the Accept-Language header.
 *
 * Note;
 * @return {Function}
 */
function locale() {
    return function (next) {
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
}