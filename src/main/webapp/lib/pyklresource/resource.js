'use strict';

function ResourceCtrl( $rootScope, $scope, $routeParams, $http, $log ) {

    var url = 'api/article/'+$routeParams.articleId;

    function loadContent() {
        $http.get( url ).success( function (data) {
            if(data !== "false") {
                $scope.article = data;
            } else {
                $log.info("ERROR getting article, or resource.");
            }
        }).error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

    $scope.abstractVisible = function () {
        if(typeof($scope.article) === "undefined")
        {
            return false;
        }
        return (typeof($scope.article.content) === "undefined");
    }

    $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
    $rootScope.$on('event:logoutConfirmed', function() { loadContent(); });

    loadContent();
}

ResourceCtrl.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log'];