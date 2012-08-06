'use strict';

function ResourceCtrl( $rootScope, $scope, $routeParams, $http, $log ) {

    var url = 'api/article/'+$routeParams.articleId;

    function loadContent() {
        $http.get( url ).success( function (data, status) {
            $scope.article = data;
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
            });
    }

    $scope.abstractVisible = function () {
        return (typeof($scope.article.content) == "undefined");
    }

    $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
    $rootScope.$on('event:logoutConfirmed', function() { loadContent(); });

    loadContent();
}

ResourceCtrl.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log'];
/*
var pyklResource = angular.module( 'pykl.resource', [] );


pyklResource.directive( 'pyklResource', [function () {
    return {
        restrict: 'ACME',
        template: '<h1>{{data.title}}</h1> \
            <p>{{data.content}}</p>'
    }
}] );

pyklResource.controller( 'ResourceCtrl', ['$rootScope', '$scope', '$log',
    function ( $rootScope, $scope, $log ) {
        function loadContent(url) {
            $http.get( url ).success( function (data, status) {
                $scope.data = data;
            }).error(function(data, status) {
                    $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
                });
        }

        $rootScope.$on('event:loginConfirmed', function() { loadContent('api/article'); });
        $rootScope.$on('event:logoutConfirmed', function() { loadContent('api/article'); });

        loadContent('api/article');
    }]
);


pyklResource.run( ['$rootScope', '$http', '$log',
    function run( $rootScope, $http, $log ) {
//doesn't seem needed
    } ]
);
       */