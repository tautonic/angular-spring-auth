/*
 * Copyright (c) 2012, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
var log = require('ringo/logging').getLogger(module.id);
var originalResponse = require('ringo/jsgi/response');

for(var f in originalResponse) exports[f]=originalResponse[f];

exports.json  = function(object, status, headers){
    var r = originalResponse.json(object);
    if (status) r.status = status;
    if (headers){
        for(var h in headers)
        {
            log.debug("Headers: "+h);
            r.headers[h]= headers[h];
        }
    }
    return r;
};