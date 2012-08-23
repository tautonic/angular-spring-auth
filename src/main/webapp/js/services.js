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
    });

