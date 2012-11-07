'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
// This is a service that creates a resource called Profile
angular.module( 'bgc.services', ['ngResource'] )
    .factory('Profile', function($resource){
        return $resource('/gc/api/profiles/:profileId',
            {},
            {
                update:     { method: 'PUT', isArray: false },
                query:     { method: 'GET', isArray: false },
                email:     { method: 'GET', isArray: false },
                username:   { method: 'GET', isArray: false }
            }
        );
    })
    .factory('Search', function($resource){
        return $resource('/gc/api/search/:type',
            {},
            {
                site:     { method: 'POST', isArray: false },
                faculty:     { method: 'POST', isArray: false },
                content:     { method: 'POST', isArray: false },
                discussions:     { method: 'POST', isArray: false }
            }
        );
    })
    .factory('Article', function($resource){
        return $resource('/gc/api/admin/articles/:articleId',
            {},
            {
                update: { method: 'PUT', isArray: false },
                query:  { method: 'GET', isArray: false }
            }
        );
    });

//angular.module('bgc.services', ['ngResource'] )


