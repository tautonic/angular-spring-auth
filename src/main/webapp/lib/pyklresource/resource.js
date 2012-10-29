'use strict';

function ListResources( $rootScope, $scope, $auth, $http, $log ) {
    var url = "api/article/search/";
    $scope.filters = {};

    function loadContent() {
        $http.get( url ).success( function (data) {
            console.log("ARTICLE RETURNED: ",data);
            if(data !== "false") {
                $scope.articles = data;
                if($scope.articles.length === 0) {
                    $log.info("No articles found.");
                }
            } else {
                $log.info("ERROR getting article, or resource.");
            }
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
            });
    }
    //this is likely not going to be used anymore, the filtering will take care of it from here on out
    $scope.byType = function(type) {
        url = 'api/article/all/' + type;
        loadContent();
    };

    $scope.byCategory = function(category) {
        url = 'api/article/all/bycategory/' + category;
        loadContent();
    };
    /*
     perhaps this should be moved to the admin panel, instead of being part of the resource page itself?
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
     }*/

    function buildFilters() {
        var result = "";
        //skips the last filter value, which is fine as long as the comma is always placed after the last real filter
        for(var property in $scope.filters) {
            if($scope.filters[property]) {
                result += property + ",";
            }
        }

        return result;
    }

    $scope.toggleDocuments = function() {
        $scope.filters.pdf = $scope.filters.documents;
        $scope.filters.word = $scope.filters.documents;
        $scope.filters.powerpoint = $scope.filters.documents;
        $scope.filters.excel = $scope.filters.documents;
        $scope.filters.text = $scope.filters.documents;
        $scope.filters.rtf = $scope.filters.documents;
    };

    $scope.search = function(term) {
        term = term || "";
        url = "api/article/search/?term=" + term + "&filters=" + buildFilters();

        loadContent();
    };

    $scope.count = function(what) {
        if(typeof($scope.articles) === "undefined")
        {
            return 0;
        }

        var result = $scope.articles.filter(function(article) {
            return (article.doctype === what);
        });

        return result.length;
    };

    $rootScope.$on(auth.event.signinConfirmed, function() { loadContent(); });
    $rootScope.$on(auth.event.signoutConfirmed, function() { loadContent(); });
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'curriculum';
        $rootScope.about = 'curriculum';
    });

    loadContent();
}


function ViewResource( $rootScope, $scope, $routeParams, $auth, $http, $log ) {
    var url = 'api/article/' + $routeParams.articleId;
    $scope.filters = {};

    function loadContent() {
        $http.get( url ).success( function (data) {
            console.log("ARTICLE RETURNED: ",data);
            if(data !== "false") {
                $scope.article = data;
                $rootScope.$broadcast('event:loadDiscussion', { 'discussionId': $scope.article._id });
                $http.post("api/views/" + $scope.article._id);
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
    };

    $rootScope.$on(auth.event.signinConfirmed, function() { loadContent(); });
    $rootScope.$on(auth.event.signoutConfirmed, function() { loadContent(); });

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'none';
    });

    loadContent();
}

ListResources.$inject = ['$rootScope', '$scope', 'auth', '$http', '$log'];
ViewResource.$inject = ['$rootScope', '$scope', '$routeParams', '$auth', '$http', '$log'];
