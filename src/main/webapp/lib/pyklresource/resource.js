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
            $routeParams.articleId = "none";
        }
    }

    function loadContent() {
        $http.get( url ).success( function (data) {
            console.log("ARTICLE RETURNED: ",data);
            if(data !== "false") {
                if($scope.pageType === "single")
                {
                    $scope.article = data;
                    $rootScope.$broadcast('event:loadDiscussion', { 'discussionId': $scope.article._id });
                } else if ($scope.pageType === "all")
                {
                    $scope.articles = data;
                    if($scope.articles.length == 0) {
                        $log.info("No articles found.");
                    }
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

    $scope.byType = function(type) {
        url = 'api/article/all/' + type;
        loadContent();
    }

    $scope.byCategory = function(category) {
        url = 'api/article/all/bycategory/' + category;
        loadContent();
    }

    $scope.addNewArticle = function() {
        $scope.pageType = "add";
        $scope.article = {
            title: '',
            description: '',
            content: ''
        }
    }

    $scope.saveNewArticle = function() {
        $http.post("api/article/new", $scope.article).success(function(data) {
            alert("article inserted successfully");
        });
    }

    $scope.search = function() {
        url = 'api/article/search?term='+$scope.searchTerm;
        loadContent();
    }

    $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
    $rootScope.$on('event:logoutConfirmed', function() { loadContent(); });

    loadContent();
}

ResourceCtrl.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log'];