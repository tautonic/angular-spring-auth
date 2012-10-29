'use strict';
function ListResources( $rootScope, $scope, $auth, $http, $log ) {
    var url = "api/article/search/";
    $scope.filters = {};
    $scope.paging = {
        size: 10
    };
    loadContent();
    //resetPaging();

    function loadContent() {
        resetPaging();
        $http.get( url ).success( function (data) {
            console.log("ARTICLE RETURNED: ",data);
            if(data !== "false") {
                $scope.articles = data;
                if($scope.articles.length === 0) {
                    $scope.paging.more = false;
                }
            } else {
                $log.info("ERROR getting article, or resource.");
            }
        }).error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

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
    }

    $scope.search = function(term) {
        term = term || "";
        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from;

        loadContent();
    }

    $scope.loadMore = function(term) {
        //if there's no more pages to load
        if(!$scope.paging.more) {
            return;
        }
        term = term || "";
        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from + "&size=" + $scope.paging.size;

        $scope.paging.from += $scope.paging.size;

        $http.get( url ).success( function (data) {
            console.log("new RETURNED: ",data);
            if(data !== "false") {
                if(data.length === 0) {
                    $scope.paging.more = false;
                } else {
                    $scope.articles = $scope.articles.concat(data);
                }
            } else {
                $log.info("ERROR getting article, or resource.");
            }
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
            });
    }

    $scope.count = function(what) {
        if(typeof($scope.articles) === "undefined")
        {
            return 0;
        }

        var result = $scope.articles.filter(function(article) {
            return (article.doctype === what);
        });

        return result.length;
    }

    $rootScope.$on($auth.event.signinConfirmed, function() { loadContent(); });
    $rootScope.$on($auth.event.signinConfirmed, function() { loadContent(); });
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'curriculum';
        $rootScope.about = 'curriculum';
    });

    function resetPaging() {
        $scope.paging.from = $scope.paging.size;
        $scope.paging.more = true;
        console.log("paging results: ",$scope.paging);
    }
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
    }

    $rootScope.$on($auth.event.signinConfirmed, function() { loadContent(); });
    $rootScope.$on($auth.event.signoutConfirmed, function() { loadContent(); });

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'none';
    });

    loadContent();
}

ListResources.$inject = ['$rootScope', '$scope', '$auth', '$http', '$log'];
ViewResource.$inject = ['$rootScope', '$scope', '$routeParams', '$auth', '$http', '$log'];


/*
 add new article functions. not supported anymore at the moment, this will either change entirely, or be put into the admin panel
 it never really worked anyway
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