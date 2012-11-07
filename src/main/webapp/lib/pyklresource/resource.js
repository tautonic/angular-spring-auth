'use strict';
function ListResources( $rootScope, $scope, $auth, $http, $log, $location ) {
    var sortBy = 'featured';
    var url = "api/article/search?sort=" + sortBy;
    $scope.filters = {};
    $scope.paging = {
        size: 10
    };

    resetPaging();
    loadContent();

    $rootScope.service = 'curriculum';

    function loadContent() {
        $scope.adminUsers = false;
        $scope.adminArticles = true;

        $rootScope.banner = 'none';
        $rootScope.about = 'none';

        $http.get( url ).success( function (data) {
            console.log("URL WAS: " + url + " ARTICLE RETURNED: ",data);
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

    $scope.sortBy = function(param) {
        if(sortBy === param)
        {
            return;
        }
        sortBy = param;

        $scope.search($scope.searchTerm);
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
        resetPaging();

        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from + "&sort=" + sortBy;

        loadContent();
    }

    $scope.loadMore = function(term) {
        //if there's no more pages to load
        if(!$scope.paging.more) {
            return;
        }
        term = term || "";
        $scope.paging.from += $scope.paging.size;
        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from + "&size=" + $scope.paging.size + "&sort=" + sortBy;


        $http.get( url ).success( function (data) {
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
        if($location.path() === '/admin/articles'){
            $rootScope.banner = 'none';
            $rootScope.about = 'none';
        }else{
            $rootScope.banner = 'curriculum';
            $rootScope.about = 'curriculum';
        }
    });

    function resetPaging() {
        $scope.paging.from = 0;
        $scope.paging.more = true;
    }
}


function ViewResource( $rootScope, $scope, $routeParams, $auth, $http, $log ) {
    var url = 'api/article/' + $routeParams.articleId;
    $scope.filters = {};
    $scope.showModal = false;

    function loadContent() {
        $http.get( url ).success( function (data) {
            console.log("ARTICLE RETURNED: ",data);
            $scope.article = data;
            $rootScope.$broadcast('event:loadDiscussion', { 'discussionId': $scope.article._id });
            $http.post("api/utility/view/" + $scope.article._id);
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
            });
    }

    $scope.toggleModal = function(value) {
        $scope.showModal = value;
        $scope.modal = {
            document: {
                title: $scope.article.title,
                url: "https://docs.google.com/a/pykl.com/document/d/1KgIuo9dcZ6ggAp4Qe8C_jE4ULb5RzwQAiEtukRyphWc/?embedd=true",
                doctype: $scope.article.doctype,
                author: $scope.article.author,
                dateCreated: $scope.article.dateCreated
            }
        }
    }

    $scope.abstractVisible = function () {
        if(typeof($scope.article) === "undefined")
        {
            return false;
        }
        return (typeof($scope.article.content) === "undefined");
    }

    $scope.increaseLikes = function(likes) {
        $scope.article.likes = likes;
    }

    $rootScope.$on($auth.event.signinConfirmed, function() { loadContent(); });
    $rootScope.$on($auth.event.signoutConfirmed, function() { loadContent(); });

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    loadContent();
}

ListResources.$inject = ['$rootScope', '$scope', '$auth', '$http', '$log', '$location'];
ViewResource.$inject = ['$rootScope', '$scope', '$routeParams', '$auth', '$http', '$log'];