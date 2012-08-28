'use strict';

/* Directives */


angular.module( 'bgc.directives', [] )
    .directive('profile', ['$http', function ($http) {
        return{
            restrict:'E',
            templateUrl:'lib/profile/partials/profileTemplate.html'
        }
    }])
    .directive('docViewer', function (){
        return{
            restrict:'E',
            scope: {
                src: '@'
            },
            template: '<iframe src={{src}} style="width:550px; height:730px;" frameborder="3px"></iframe>'
        }
    });
