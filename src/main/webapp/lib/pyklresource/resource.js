'use strict';

function ResourceCtrl( $rootScope, $scope, $routeParams, $http, $log ) {
    var url = 'api/article/';

    setup();

    function setup() {
        if(($routeParams) && ($routeParams.articleId)) {
            url += $routeParams.articleId;
            $scope.pageType = "single";
        } else {
            url += 'all';
            $scope.pageType = "all";
        }
    }

    function loadContent() {
        $http.get( url ).success( function (data) {
            console.log("ARTICLE RESPONSE WAS: ",data);

            if(data !== "false") {
                if($scope.pageType === "single")
                {
                    $scope.article = data;
                } else if ($scope.pageType === "all")
                {
                    $scope.articles = data;
                    $scope.container = $('#article-list');
                     /*$scope.container.masonry({
                        // options
                        itemSelector : '.article',
                        columnWidth : 230
                    });
                     */
                    //$scope.container.masonry('reload');
                    console.log("LOADED MASONRY?");
                }
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