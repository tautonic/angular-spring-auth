'use strict';

/* Directives */


angular.module( 'bgc.directives', [] )
    .directive('profile', ['$http', function ($http) {
        return{
            restrict:'E',
            templateUrl:'lib/profile/partials/profileTemplate.html'
        }
    }]).directive('checkLast', function () {
        return function (scope, element, attrs) {

            if (scope.$last=== true) {
                element.ready(function () {
                    console.log("ACTIVATE MASONRY!");
                    $('#article-list').masonry({  itemSelector : '.article', columnWidth: 230});

                })
            }
        }
    });