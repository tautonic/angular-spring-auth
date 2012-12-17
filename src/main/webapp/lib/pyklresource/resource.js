'use strict';
function ListResources( $rootScope, $scope, $routeParams, $auth, $http, $log, $location ) {
    var sortBy = $routeParams.sortBy || 'featured';
    var category = $routeParams.service || '';
    var tagFilter = '';

    var attachmentIndex = 0;
    var attachments;

    $scope.categories = {
        'curriculum': {count: 0},
        'access': {count: 0},
        'facultydev': {count: 0},
        'nextopp': {count: 0},
        'handbook': {count: 0},
        'entrepreneurship': {count: 0},
        'gceemsce': {count: 0}
    };

    $scope.doctypes = {
        'pdf': {count: 0},
        'word': {count: 0},
        'ppt': {count: 0},
        'xls': {count: 0},
        'text': {count: 0},
        'rtf': {count: 0},
        'images': {count: 0},
        'videos': {count: 0}
    }

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
        $http.get( 'api/article/' + id ).success( function (data) {
            var uri = data.uri.replace('http://', '');
            var filesize = data.filesize === undefined ? 'Filesize unavailable' : data.filesize;
            $scope.modal = {
                document: {
                    title: data.title,
                    description: data.description,
                    url: 'http://docs.google.com/viewer?url=http://' + uri + '&embedded=true',
                    directLink: "http://" + uri,
                    doctype: data.doctype,
                    author: data.author,
                    dateCreated: data.dateCreated,
                    filename: data.name,
                    filesize: filesize
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
        if(category === '') {
            $rootScope.banner = 'curriculum';
            $rootScope.about = 'curriculum';
            $rootScope.service = 'curriculum';
        } else {
            $rootScope.banner = category;
            $rootScope.about = category;
            $rootScope.service = category;
        }
    }

    var url = "api/article/search?sort=" + sortBy + "&category=" + category;
    $scope.filters = {};
    $scope.paging = {
        size: 10
    };

    resetPaging();
    loadContent();


    function loadContent() {
        $scope.adminUsers = false;
        $scope.adminArticles = true;

        $scope.location = $location;

        $http.get( url ).success( function (data) {
            if(data !== "false") {
                $scope.articles = data;
                // loop through the array of articles
                $scope.articles.forEach(function(article){
                    // add an attribute to the article that will
                    // contain the array of doctypes attached to the article
                    article.childDoctypes = [];
                    // loop through each article's attachments
                    article.attachments.forEach(function(attachment){
                        $http.get('api/article/' + attachment)
                            .success(function(data, status){
                                // add the attachment doctype to the array
                                article.childDoctypes.push(data.doctype);
                            });
                    });
                });
                if($scope.articles.length < $scope.paging.size) {
                    $scope.paging.more = false;
                }
            } else {
                $log.info("ERROR getting article, or resource.");
            }
        }).error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });

        // get article category facets to display article counts in each category
        $http.get('api/facets/article')
            .success(function(data, status){
                $scope.totalCount = data.content.facets.category.total;
                data.content.facets.category.terms.forEach(function(term){
                    $scope.categories[term.term].count = term.count;
                });
            });

        // get article attachment facets
        $http.get('api/facets/attachment')
            .success(function(data, status){
                $scope.attachmentCount = data.content.facets.mimetype.total;
                data.content.facets.mimetype.terms.forEach(function(term){
                    $scope.doctypes[term.term].count = term.count;
                });
            })
            .error(function(data, status){

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

        if(!$scope.filters.documents){
            url = "api/article/search?sort=" + sortBy + "&category=" + category;
            loadContent();
        }else{
            loadFilteredContent();
        }
    };

    function loadFilteredContent(){
        var mimetypes = buildFilters();

        if(mimetypes == ''){
            loadContent();
            return;
        }

        // remove the commas and trailing space from the filter string
        mimetypes = mimetypes.replace(/,/g, ' ');
        mimetypes = mimetypes.replace(/\s+$/, '');

        var attachments;

        // get all attachment resources that match the filter terms/mimetypes
        $http.get('api/attachments/mimetypes/?mimetypes=' + mimetypes)
            .success(function(data, status){
                var refIds = [];
                attachments = data.content;

                attachments.forEach(function(attachment){
                    refIds.push(attachment.ref);

                    //remove duplicates
                    refIds = jQuery.unique(refIds);
                });

                // we have an array of refids, lets get the resources
                var resourceUrl = refIds.join('&ids[]=');
                resourceUrl = '?ids[]=' + resourceUrl;
                $http.get('api/attachments/' + resourceUrl)
                    .success(function(data, status){
                        $scope.articles = data.content;

                        // loop through the array of articles
                        $scope.articles.forEach(function(article){
                            // add an attribute to the article that will
                            // contain the array of doctypes attached to the article
                            article.childDoctypes = [];
                            // loop through each article's attachments
                            article.attachments.forEach(function(attachment){
                                $http.get('api/article/' + attachment)
                                    .success(function(data, status){
                                        // add the attachment doctype to the array
                                        article.childDoctypes.push(data.doctype);
                                    });
                            });
                        });
                    })
                    .error(function(data, status){
                        alert('There was an error retreiving the articles');
                    });
            })
            .error(function(data, status){
                alert('There was an error retreiving the resources');
            });
    }

    $scope.search = function(term, checked) {
        if(checked){
            term = "";
        }
        term = term;

        resetPaging();

        url = "api/article/search/?term=" + term + "&filters=" + buildFilters() + "&from=" + $scope.paging.from + "&size=" + $scope.paging.size + "&sort=" + sortBy + "&category=" + category + tagFilter;

        if(term == ""){
            loadFilteredContent();
        }else{
            loadContent();
        }
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
            if(category === '') {
                $rootScope.banner = 'curriculum';
                $rootScope.about = 'curriculum';
                $rootScope.service = 'curriculum';
            } else {
                $rootScope.banner = category;
                $rootScope.about = category;
                $rootScope.service = category;
            }
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
            // add an attribute to the article that will
            // contain the array of doctypes attached to the article
            $scope.article.childDoctypes = [];
            // loop through each article's attachments
            $scope.article.attachments.forEach(function(attachment){
                $http.get('api/article/' + attachment)
                    .success(function(data, status){
                        // add the attachment doctype to the array
                        $scope.article.childDoctypes.push(data.doctype);
                    });
            });
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
            var uri = data.uri.replace('http://', '');
            var filesize = data.filesize === undefined ? 'Filesize unavailable' : data.filesize;
            $scope.modal = {
                document: {
                    title: data.title,
                    description: data.description,
                    url: 'http://docs.google.com/viewer?url=http://' + uri + '&embedded=true',
                    directLink: "http://" + uri,
                    doctype: data.doctype,
                    author: data.author,
                    dateCreated: data.dateCreated,
                    filename: data.name,
                    filesize: filesize
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