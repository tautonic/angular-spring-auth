'use strict';

/* Directives */


angular.module( 'bgc-profile.directives', [] )
    .directive('profile', ['$http', function ($http) {
    return{
        restrict:'E',
        templateUrl:'lib/profile/partials/profileTemplate.html'
    }
    }]);
