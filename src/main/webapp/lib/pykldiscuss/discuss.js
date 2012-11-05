'use strict';

function ListDiscussions($rootScope, $scope, $routeParams, $http, $log, $auth, $location) {
    var url = 'api/discussions/all';

    setupScope();

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

    loadContent();
}


function ViewDiscussion($rootScope, $scope, $routeParams, $http, $log, $auth, $location) {
    var url = 'api/discussions/';

    $scope.hide = ($routeParams.articleId === null);

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

            //this check is needed to handle things like discussions connected with articles
            if ($routeParams.articleId) {
                $scope.pageType = "byParent/" + $routeParams.articleId;
                $scope.reply.title = '';
            }

            url = url + $scope.pageType;
            $scope.pageType = "single";

            $scope.$on('$routeChangeSuccess', function(){
                $rootScope.banner = 'none';
                $rootScope.about = 'none';
            });
        }
        //$rootScope.$watch('auth.isAuthenticated()', function(newValue, oldValue) { console.log('you are now (not) authenticated', newValue, oldValue, $rootScope.auth.getUsername()); });
    }

    function loadContent() {
        $http.get(url).success(function (data) {
            if (data !== "false") {
                $scope.discussion = data[0];
                $scope.isLoaded = true;
                $scope.hide = false;
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
        }
        if (quoting) {
            var content = "<p><blockquote>" + post.message + "</blockquote></p>" + "<p></p>";
            post.reply.message = content;
        } else {
            post.reply.message = null;
        }
    };

    $scope.submitReply = function (post) {
        var reply;
        if(post !== undefined) {
            reply = post.reply.message;
        } else {
            reply = $scope.reply.message;
        }
        var replyUrl = 'api/discussions/' + $scope.discussion.threadId;
        $http.post(replyUrl, { reply:reply }).success(function (data) {
            if(post !== undefined) {
                post.reply.show = false;
                post.reply.message = '';
            } else {
                $scope.reply.show = false;
                $scope.reply.message = '';
                $scope.reply.title = '';
            }
            $scope.discussion.children.unshift(data);
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
            console.log("edit saved successfully to server, url: " + url + "/" + post._id);
        });
    };

    $scope.editFormInvalid = function(scope) {
        return scope.editForm.$invalid;
    }

    //fired by the view resource controller after it's loaded, used to load a discussion as part of curriculum content or something
    $rootScope.$on('event:loadDiscussion', function ($event, $args) {
        $routeParams.discussionId = $args.discussionId;
        url = 'api/discussions/';
        setupScope();
        loadContent();
    });
}

function NewDiscussion($rootScope, $scope, $routeParams, $http, $auth, $location) {
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
            parentId:($routeParams.articleId || null),
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
                    if($scope.hasContent) {
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

ListDiscussions.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$auth', '$location'];
ViewDiscussion.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$auth', '$location'];
NewDiscussion.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$auth', '$location'];