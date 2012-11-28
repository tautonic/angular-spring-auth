'use strict';

function ListDiscussions($rootScope, $scope, $routeParams, $http, $log) {
    $scope.paging = {
        size: 10
    };

    resetPaging();
    var url = "api/discussions/all?from=" + $scope.paging.from + "&size=" + $scope.paging.size;

    setupScope();
    loadContent();

    function setupScope() {
        $scope.query = '';
        $scope.enterReply = "Reply to discussion";
        $scope.reply = {
            show:false,
            message:''
        };
        $scope.isLoaded = false;

        $scope.$on('$routeChangeSuccess', function(){
            $rootScope.banner = 'network';
            $rootScope.about = 'network';
        });
    }

    function loadContent() {
        if ($routeParams.articleId === "none") {
            $scope.pageType = "none";
            $scope.isLoaded = true;
            return;
        }
        $http.get(url).success(function (data) {
            if (data !== "false") {
                $scope.discussion = data;
                $scope.isLoaded = true;
                if($scope.discussion.length < $scope.paging.size) {
                    $scope.paging.more = false;
                }
            } else {
                $log.info("Error loading discussion.");
            }
        }).error(function (data, status) {
                $log.info("ERROR retrieving protected resource: " + data + " status: " + status);
            });
    }

    $scope.hasLinkedObject = function(post) {
        return post.linkedItem.exists;
    };

    $scope.noDiscussions = function () {
        return (($scope.discussion) && ($scope.discussion.length === 0));
    };

    //hides posts that have been marked as spam by the user
    $scope.hidePost = function(id, action) {
        //either increase or decrease the spam counter
        var change = 0;
        switch(action) {
            case "inc":
                change = 1;
                break;
            case "dec":
                change = -1;
                break;
        }

        $scope.discussion.forEach(function(post) {
            if(post._id === id) {
                post.spam += change;
                post.hidden = (change > -1);
            }
        });
    };

    $scope.loadMore = function(term) {
        //if there's no more pages to load
        if(!$scope.paging.more) {
            return;
        }
        term = term || "";
        $scope.paging.from += $scope.paging.size;
        url = "api/discussions/all?from=" + $scope.paging.from + "&size=" + $scope.paging.size;


        $http.get( url ).success( function (data) {
            if(data !== "false") {
                if(data.length === 0) {
                    $scope.paging.more = false;
                } else {
                    $scope.discussion = $scope.discussion.concat(data);
                }
            } else {
                $log.info("ERROR getting discussions.");
            }
        }).error(function(data, status) {
                $log.info("ERROR retrieving discussions: "+data+" status: "+status);
            });
    };

    function resetPaging() {
        $scope.paging.from = 0;
        $scope.paging.more = true;
    }
}

function ViewDiscussion($rootScope, $scope, $routeParams, $http, $log, $auth) {
    $scope.paging = {
        size: 5
    };

    var url = 'api/discussions/';
    var parentId;
    var dataType = "discussion";

    $scope.hide = ($routeParams.articleId === null);

    //resetPaging();
    setupScope();
    loadContent();

    function setupScope() {
        $scope.query = '';
        $scope.enterReply = "Reply to discussion";
        $scope.reply = {
            show:false
        };
        $scope.isLoaded = false;

        if ($routeParams) {
            $scope.pageType = $routeParams.discussionId;
            parentId = $routeParams.discussionId;

            //this check is needed to handle things like discussions connected with articles
            if ($routeParams.articleId) {
                $scope.pageType = "byParent/" + $routeParams.articleId;
                $scope.reply.title = '';
                dataType = "comment";
                parentId = $routeParams.articleId;
            }

            url = url + $scope.pageType;// + "?from=" + $scope.paging.from + "&size=" + $scope.paging.size;

            $scope.$on('$routeChangeSuccess', function(){
                $rootScope.banner = 'none';
                $rootScope.about = 'none';
            });
        }
    }

    function loadContent() {
        $http.get(url).success(function (data) {
            if (data !== "false") {
                $scope.discussion = data[0];
                $scope.isLoaded = true;
                $scope.hide = false;

                /*if($scope.discussion.children.length < $scope.paging.size) {
                    $scope.paging.more = false;
                }*/

                $http.post("api/utility/view/" + $scope.discussion._id).success(function(data) {
                    $scope.discussion.views = data.views;
                });
            } else {
                $scope.hide = true;
                $rootScope.$broadcast("event:newDiscussion");
            }
        }).error(function (data, status) {
                $log.info("ERROR retrieving protected resource: " + data + " status: " + status);
            });
    }

    $scope.replyTo = function (post, quoting) {
        quoting = quoting || false;
        if (!$rootScope.auth.isAuthenticated) {
            $rootScope.$broadcast($auth.event.signinRequired);
            return;
        }

        post.reply = {
            show: true
        };

        if (quoting) {
            post.reply.message = "<p><blockquote>" + post.message + "</blockquote></p>" + "<p></p>";
        } else {
            post.reply.message = null;
        }
    };

    $scope.submitReply = function (post) {
        var replyArgs = {
            reply: '',
            title: '',
            id: '',
            parentId: parentId,
            dataType: dataType
        };

        //if we're replying to a single, solitary post
        if(post !== undefined) {
            replyArgs.reply = post.reply.message;
            replyArgs.title = "";
            replyArgs.threadId = post._id;

        } else {
            //otherwise, we're replying to a larger discussion
            replyArgs.reply = $scope.reply.message;
            replyArgs.title = $scope.reply.title;
            replyArgs.threadId = $scope.discussion.threadId;
        }

        var replyUrl = 'api/discussions/' + replyArgs.threadId;

        $http.post(replyUrl, replyArgs).success(function (data) {
            if(post !== undefined) {
                post.reply.show = false;
                post.reply.message = '';
                data.children = [];
                post.children.unshift(data);
            } else {
                $scope.reply.show = false;
                $scope.reply.message = '';
                $scope.reply.title = '';
                data.children = [];
                $scope.discussion.children.unshift(data);
            }

            $scope.discussion.commentCount++;
        });
    };

    $scope.cancelReply = function (post) {
        post.reply.show = false;
    };

    $scope.canEdit = function (post) {
        if (post === undefined) {
            return false;
        }

        return (post.creator._id == $auth.id);
    };

    $scope.edit = function (post) {
        post.edited = post.message;
        post.edit = true;
    };

    $scope.cancelEdit = function (post) {
        post.edit = false;
        delete post.edited;
    };

    $scope.editPost = function (post) {
        post.message = post.edited;
        delete post.edited;
        post.edit = false;
        $http.put(url + "/" + post._id, post).success(function (data) {
        });
    };

    $scope.editFormInvalid = function(scope) {
        return scope.editForm.$invalid;
    };

    //fired by the view resource controller after it's loaded, used to load a discussion as part of curriculum content or something
    $rootScope.$on('event:loadDiscussion', function ($event, $args) {
        $routeParams.discussionId = $args.discussionId;
        url = 'api/discussions/';
        setupScope();
        loadContent();
    });

    $scope.increaseLikes = function(likes) {
        $scope.discussion.likes = likes;
    };

    //hides posts that have been marked as spam by the user
    $scope.hidePost = function(id, action) {
        //either increase or decrease the spam counter
        var change = 0;
        switch(action) {
            case "inc":
                change = 1;
                break;
            case "dec":
                change = -1;
                break;
        }
        if($scope.discussion._id == id) {
            $scope.discussion.spam += change;
            return;
        }

        $scope.discussion.children.forEach(function(post) {
            if(post._id === id) {
                post.spam += change;
                post.hidden = (change > -1);
            }
        });
    };

    $scope.deleteDiscussion = function() {
        $http['delete']('api/discussions/'+$scope.discussion._id).success(function(data) {
            console.log("ENTIRE DISUCSISOSN DELETED");
        })
    };

    $scope.deletePost = function(post) {
        $http['delete']('api/discussions/'+post._id).success(function(data) {
            console.log("SINGLE POST DELETED");
        })
    };

    /* infinite scroll here has been removed because there's issues in the backend that prevent it from being feasible. See BGC-173 for details
    $scope.loadMore = function(term) {
        //if there's no more pages to load
        if(!$scope.paging.more) {
            return;
        }
        term = term || "";
        $scope.paging.from += $scope.paging.size;
        url = "api/discussions/" + $scope.pageType + "?from=" + $scope.paging.from + "&size=" + $scope.paging.size;


        $http.get( url ).success( function (data) {
            if(data !== "false") {
                if(data.length === 0) {
                    $scope.paging.more = false;
                } else {
                    $scope.discussion.children = $scope.discussion.children.concat(data);
                }
            } else {
                $log.info("ERROR getting discussions.");
            }
        }).error(function(data, status) {
                $log.info("ERROR retrieving discussions: "+data+" status: "+status);
            });
    };

    function resetPaging() {
        $scope.paging.from = 0;
        $scope.paging.more = true;
    }*/
}

function NewDiscussion($rootScope, $scope, $routeParams, $http, $location) {
    var url = 'api/discussions/new';
    $scope.hide = ($routeParams.articleId === null);

    $scope.query = '';
    $scope.enterReply = "Reply to discussion";
    $scope.reply = {
        show:false,
        message:''
    };

    $scope.reply.title = '';

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'none';
    });


    $scope.createDiscussion = function () {
        var newPost = {
            title:$scope.reply.title || "Article Discussion",
            parentId: ($routeParams.articleId || null),
            dataType: ($routeParams.articleId) ? "comment" : "discussion",
            posts:[
                {
                    message:$scope.reply.message
                }
            ]
        };

        $http.post('api/discussions/new', newPost).success(function (data) {
            if (data.success === true) {
                url = 'api/discussions/byParent/' + $routeParams.articleId;
            } else {
                if (data.newId !== false) {
                    if($routeParams.articleId) {
                        $rootScope.$broadcast('event:loadDiscussion', { 'discussionId': data.newId });
                    } else {
                        $location.path('/network/discussion/view/' + data.newId);
                    }
                } else {
                    alert("There was an error.");
                }
            }
        });
    };

    $rootScope.$on('event:newDiscussion', function () {
        $scope.hide = false;
    });

    /* originally used to prevent signed in users from seeing the new discussion page. not really needed anymore, as there's text for "sign in to start a discussion" now. which works with some other elements.
    $rootScope.$on($auth.event.signoutConfirmed, function () {
        $location.path('/discussion/all');
    });*/

    //fired by the view resource controller after it's loaded, by default this should hide the new reply until it's discovered that the discussion for that object doesn't exist yet
    $rootScope.$on('event:loadDiscussion', function ($event, $args) {
        $scope.hide = true;
    });
}

ListDiscussions.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log'];
ViewDiscussion.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$auth'];
NewDiscussion.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$location'];