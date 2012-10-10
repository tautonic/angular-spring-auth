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
 * locale - A string representing the language of the content (ie en_GB).
 *
 * When considered together, the <key.locale> composite results in the location of a specific
 * record in the database. Keep in mind that the locale is not always an exact match. For example,
 * if the database has records in 'es', 'en' and 'en_GB', a search for a locale of 'en_ZA' will
 * result in the "downgraded" record for 'en'. In fact, a default locale is configured into the
 * wen server resulting in the default locale being returned whenever a language code cannot be
 * located.
 *
 * API
 *
 * GET /api/cms/:key
 *     :key - a unique id that describes the content.
 *     [Accept-Language] - The header value is used to determine the locale used to retrieve
 *         the appropriate record from the cms.
 *
 * POST /api/cms/
 *     [Accept-Language] - The header value is used to determine the locale used to create
 *         the appropriate record from the cms. If the 'locale' property is included in the
 *         JSON record, the property will take precedence.
 *     [Body] - A JSON object representing the CMS content to create.
 *
 * PUT /api/cms/:key
 *     :key - a unique id that describes the content.
 *     [Accept-Language] - The header value is used to determine the locale used to update
 *         the appropriate record from the cms.
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
 *     GET /api/cms/intro  <Accept-Language = en_GB>
 *     GET /api/cms/intro  <Accept-Language = en_US>
 *
 *  Suppose the CMS contains only the 'en' locale. All three requests will receive the expected result
 *  for the 'en' locale only, however the cache will store the same CMS record for each composite key.
 *  Therefore there will be the same JSON object stored for each of these keys:
 *
 *      intro/en: {...intro json for en locale...}
 *      intro/en_GB: {...intro json for en locale...}
 *      intro/en_US: {...intro json for en locale...}
 *
 */

/********************
 Requires
 *********************/

var {Application} = require('stick');
var store = require('store-js');
var {json} = require( 'ringo/jsgi/response' );

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
 * GET /api/cms/:key
 *     :key - a unique id that describes the content.
 *     [Accept-Language] - The header value is used to determine the locale used to retrieve
 *         the appropriate record from the cms.
 */
app.get('/:key', function (req, key) {
    var locale = req.params.locale || req.locale;
    var lookup = key + '/' + locale;
    return json(map.get(key));
});


function locale() {
    return function (next) {
        return function (req) {
            Object.defineProperty(req, "locale", {
                get:function () {
                    if (!!req.headers['x-rt-skip-locale']) return null;

                    var locale = req.env.servletRequest.getLocale();
                    if (!locale) return null;

                    return locale;
                }
            });

            return next(req);
        }
    }
}