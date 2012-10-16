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
    scanForBundles(basename);
    return json({status: 'ok'});
});


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
    var regex = '^' + basename + '(_\\w{2}(_\\w{2})?)?\\.properties$';
    var files = root.listFiles(
            new java.io.FilenameFilter(
                    {
                        accept: function (dir, name) {
                            return name.matches(regex);
                        }
                    }
            )
    );

    files.forEach(function(file) {
        log.info('Found resource bundle: ' + file.name);
    }
}


