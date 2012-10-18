/*
 * Copyright (c) 2012, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
/**
 * @module api/seedcms
 *
 * @fileOverview This module will read in CMS data found in property files at startup and
 * push this CMS content to Zocia for persisting. Any content that is already in Zocia will
 * *not* be overwritten, thus preserving changes the user's have made to deployed content.
 *
 * API
 *
 * GET /api/seedcms
 */

/********************
 Requires
 *********************/

var {Application} = require('stick');
var store = require('store-js');
var {json} = require('utility/extendedResponse');
var log = require('ringo/logging').getLogger(module.id);


/********************
 Global Vars
 *********************/
var app = exports.app = Application();
app.configure('route');

// todo: pull from a truly global location
var INDEX = 'gc';

// It is important to realize that this map has nothing to do with the map of resources stored
// in the Zocia system; save for its name.
var map = store.getMap(INDEX, 'resources');

/**
 * GET /api/seedcms/:bundle
 */
app.get('/:basename', function (req, basename) {
    // Get the names/locales of all resource bundles with the given basename on the
    // classpath. For each bundle, read the properties and put into our CMS map (which
    // will send content to Zocia).
    scanForBundles(basename).forEach(function(bundle) {
        var props = readProps(bundle);
        writeProps(props, bundle.locale);
    });

    return json({status: 'ok'});
});


function readProps(bundle) {
    log.info('Reading bundle {}', JSON.stringify(bundle, null, 4));
    var result = {};

    var loader = java.lang.Thread.currentThread().getContextClassLoader();
    var input = new java.io.InputStreamReader(loader.getResourceAsStream(bundle.name), 'UTF-8');
    try {
        var props = new java.util.Properties();
        props.load(input);

        var names = props.stringPropertyNames().iterator();
        while (names.hasNext()) {
            var name = names.next();
            var nameParts = name.split('.');
            if (nameParts.length != 2) {
                throw java.lang.String.format('Illegal name format in CMS bundle [%s]. Name [%s] ' +
                        'must have only one period.', bundle.name, name);
            }

            var key = result[name];
            if (!key) result[name] = {};

            key[nameParts[0]][nameParts[1]] = props.getProperty(name);
        }
    } finally {
        input.close();
    }
    return result;
}
function writeProps(props, locale) {
    log.info('Writing props: {}, locale: {}', JSON.stringify(props, null, 4), locale);

    Object.keys(props).forEach(function(name) {
        if (!propExists(name, locale)) {
            var record = props[name];
            log.info('Property does not exist: {}@{}, value: {}', name, locale, JSON.stringify(record));
            var key = name + '@' + locale;
            log.info('Adding key [{}] and value [{}] to cms map.', key, record);
            var resource = makeResource(name, locale, record);
            map.put(key, resource);
        }
    });
}

function propExists(key, locale) {
    var lookup = key;
    if (locale) lookup +=  '@' + locale;
    var resources = map.get(lookup);

    log.info('Found resource [{}]? {}', lookup, JSON.stringify(resources));
    if (!Array.isArray(resources) || resources.length === 0) return false;

    var resource = resources.shift();
    log.info('Does resource locale [{}] match requested locale [{}]? {}',
            resource.locale, locale, !!(resource.locale === locale));
    return resource.locale === locale;
}

function makeResource(name, locale, record) {
    // Record will be a JSON object with properties { title: 'text', content: 'more text' }
    var result = {
        key: name,
        author: 'seedcms',
        format: 'aside',
        locale: locale,
        mimetype: 'text/html'
    };
    Object.keys(record).forEach(function (key) {
        result[key] = record[key];
    });
    return result;
}

/**
 * This function will scan the classpath for all resource bundle files matching the basename.
 * @param basename
 */
function scanForBundles(basename) {
    // Get the class loader for the current context
    var loader = java.lang.Thread.currentThread().getContextClassLoader();

    // Set the root of our search to the classpath root
    var root = new java.io.File(
            loader.getResource('/').getFile()
    );

    // Obtain an array of all files which match the naming of the resource bundles
    var regex = new RegExp('^' + basename + '(_\\w{2}(_\\w{2})?)?\\.properties$');
    var files = root.listFiles(
            new java.io.FilenameFilter(
                    {
                        accept: function (dir, name) {
                            log.info('Type: ', typeof name);
                            return !!name.match(regex);
                        }
                    }
            )
    );

    // todo: Use properties to determine the default locale instead of assuming english
    return files.map(function(file) {
        var re = file.name.match(regex).filter(function(part) {
            return part != null;
        });
        log.info('Match on {} is {}', file.name, JSON.stringify(re, null, 4));
        return {
            name: file.name,
            locale: re.length > 1 && re[1] ? re.slice(1).join('').substring(1) : 'en'
        };
    });
}


