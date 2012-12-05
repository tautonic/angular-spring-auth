'use strict';
function ListResources( $rootScope, $scope, $routeParams, $auth, $http, $log, $location ) {
    var sortBy = $routeParams.sortBy || 'featured';
    var category = $routeParams.service || '';
    var tagFilter = '';

    var attachmentIndex = 0;
    var attachments;

    $scope.$on('showAttachmentModal', function(args){
        attachments = args.targetScope.thumb.attachments;
        loadAttachment();
        $scope.showModal = true;
    });

    $scope.toggleModal = function(value) {
        $scope.showModal = value;
        if(value) {
            loadAttachment();
        }
    };

    $scope.next = function() {
        changeAttachmentIndex("inc");
    };

    $scope.previous = function() {
        changeAttachmentIndex("dec");
    };

    function loadAttachment() {
        var id = attachments[attachmentIndex];
        $http.get( 'api/attachments/' + id ).success( function (data) {
            $scope.modal = {
                document: {
                    title: data.content.title,
                    description: data.content.description,
                    url: 'http://docs.google.com/viewer?url=http:' + data.content.uri + '&embedded=true',
                    directLink: "http:" + data.content.uri,
                    doctype: data.content.doctype,
                    author: data.content.author,
                    dateCreated: data.content.dateCreated
                }
            };
            $http.post("api/utility/view/" + id);
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
            });
    }

    //we do this in a function so we can handle cases where it goes too far in one direction or another
    function changeAttachmentIndex(direction) {
        attachmentIndex += (direction === "inc") ? 1 : -1;

        if(attachmentIndex >= attachments.length) {
            attachmentIndex = 0;
        } else if(attachmentIndex < 0) {
            attachmentIndex = attachments.length - 1;
        }

        loadAttachment();
    }

    $scope.hasMoreThanAttachments = function(total) {
        return (attachments && attachments.length > total);
    };

    $scope.tabs = {
        featured: true,
        recent: false,
        popular: false
    };

    if( ($routeParams) && ($routeParams.sortBy) ) {
        sortBy = $routeParams.sortBy;
        $scope.tabs.featured = false;
        $scope.tabs[sortBy] = true;
    }

    if($location.path() === '/admin/articles'){
        $rootScope.banner = 'none';
        $rootScope.about = 'none';
    } else if($location.path() === '/summit') {
        $rootScope.banner = 'summit';
        $rootScope.about = 'summit';
        category = 'summit';
    } else {
        $rootScope.banner = 'curriculum';
        $rootScope.about = 'curriculum';
    }

    var url = "api/article/search?sort=" + sortBy + "&category=" + category;
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

        $scope.location = $location;

        $http.get( url ).success( function (data) {
            if(data !== "false") {
                $scope.articles = data;
                if($scope.articles.length < $scope.paging.size) {
                    $scope.paging.more = false;
                }
            } else {
                $log.info("ERROR getting article, or resource.");
            }
        }).error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

    $scope.filterByTag = function(tag) {
        tagFilter = '&tag=' + tag;
        resetPaging();

        url = "api/article/search/?filters=" + buildFilters() + "&from=" + $scope.paging.from + "&sort=" + sortBy + "&category=" + category + tagFilter;

        loadContent();
    };

    $scope.sortBy = function(param) {
        if(sortBy === param)
        {
            return;
        }
        $scope.tabs[sortBy] = false;
        $scope.tabs[param] = true;
        sortBy = param;

        $scope.search($scope.searchTerm);
    };

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
        $scope.filters.ppt = $scope.filters.documents;
        $scope.filters.xls = $scope.filters.documents;
        $scope.filters.text = $scope.filters.documents;
        $scope.filters.rtf = $scope.filters.documents;
    };

    $scope.search = function(term) {
        term = term || "";
        resetPaging();

        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from + "&sort=" + sortBy + "&category=" + category + tagFilter;

        loadContent();
    };

    $scope.loadMore = function(term) {
        //if there's no more pages to load
        if(!$scope.paging.more) {
            return;
        }
        term = term || "";
        $scope.paging.from += $scope.paging.size;
        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from + "&size=" + $scope.paging.size + "&sort=" + sortBy + "&category=" + category + tagFilter;


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
    };

    function count(what) {
        if(typeof($scope.articles) === "undefined")
        {
            return 0;
        }

        var result = $scope.articles.filter(function(element) {
            return (element.doctype === what);
        });

        return result.length;
    }

    $scope.countDocuments = function() {
        var total = 0;
        total = count('pdf') + count('word') + count('ppt') + count('xls') + count('text') + count('rtf');

        return total;
    };

    $scope.count = count;

    $rootScope.$on($auth.event.signinConfirmed, function() { loadContent(); });
    $rootScope.$on($auth.event.signinConfirmed, function() { loadContent(); });

    $scope.$on('$routeChangeSuccess', function(){
        if($location.path() === '/admin/articles'){
            $rootScope.banner = 'none';
            $rootScope.about = 'none';
        } else if($location.path() === '/summit') {
            $rootScope.banner = 'summit';
            $rootScope.about = 'summit';
            category = 'summit';
        } else {
            $rootScope.banner = 'curriculum';
            $rootScope.about = 'curriculum';
        }
    });

    function resetPaging() {
        $scope.paging.from = 0;
        $scope.paging.more = true;
    }

    $scope.deleteArticle = function(element, attr) {
        $http['delete']('api/admin/articles/' + attr.article._id).success( function() {
            element.parents('.article.admin.row').fadeOut('slow', function(){
                $(this).remove();
            });
        });
    };
}


function ViewResource( $rootScope, $scope, $routeParams, $auth, $http, $log ) {
    var url = 'api/article/' + $routeParams.articleId;
    var attachmentIndex = 0;
    $scope.filters = {};
    $scope.showModal = false;
    $scope.url = baseUrl + '/#/content/view/' + $routeParams.articleId;

    function loadContent() {
        $http.get( url ).success( function (data) {
            $log.info("ARTICLE RETURNED: ",data);
            $scope.article = data;
            $rootScope.$broadcast('event:loadDiscussion', { 'discussionId': $scope.article._id });
            $http.post("api/utility/view/" + $scope.article._id);
        }).error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

    $scope.toggleModal = function(value) {
        $scope.showModal = value;
        if(value) {
            loadAttachment();
        }
    };

    $scope.next = function() {
        changeAttachmentIndex("inc");
    };

    $scope.previous = function() {
        changeAttachmentIndex("dec");
    };

    function loadAttachment() {
        var id = $scope.article.attachments[attachmentIndex];
        $http.get( 'api/article/' + id ).success( function (data) {
            $scope.modal = {
                document: {
                    title: data.title,
                    description: data.description,
                    url: 'http://docs.google.com/viewer?url=http:' + data.uri + '&embedded=true',
                    directLink: "http:" + data.uri,
                    doctype: data.doctype,
                    author: data.author,
                    dateCreated: data.dateCreated
                }
            };
            $http.post("api/utility/view/" + id);
        }).error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

    //we do this in a function so we can handle cases where it goes too far in one direction or another
    function changeAttachmentIndex(direction) {
        attachmentIndex += (direction === "inc") ? 1 : -1;

        if(attachmentIndex >= $scope.article.attachments.length) {
            attachmentIndex = 0;
        } else if(attachmentIndex < 0) {
            attachmentIndex = $scope.article.attachments.length - 1;
        }

        loadAttachment();
    }

    $scope.hasMoreThanAttachments = function(total) {
        return (($scope.article) && ($scope.article.attachments) && ($scope.article.attachments.length > total));
    };

    $scope.abstractVisible = function () {
        if(typeof($scope.article) === "undefined")
        {
            return false;
        }
        return (typeof($scope.article.content) === "undefined");
    };

    $scope.increaseLikes = function(likes) {
        $scope.article.likes = likes;
    };

    $scope.$on($auth.event.signoutConfirmed, function() { loadContent(); });

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    loadContent();
}

ListResources.$inject = ['$rootScope', '$scope', '$routeParams', '$auth', '$http', '$log', '$location'];
ViewResource.$inject = ['$rootScope', '$scope', '$routeParams', '$auth', '$http', '$log'];