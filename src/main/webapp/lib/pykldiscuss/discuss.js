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

    $rootScope.$on($auth.event.signoutConfirmed, function () {
        if ($scope.$scope.pageType == "new") {
            $location.path('/discussion/all');
        }
    });
}


function ViewDiscussion($rootScope, $scope, $routeParams, $http, $log, $auth, $location) {
    var url = 'api/discussions/';

    $scope.hide = ($routeParams.articleId === null);

    setupScope();

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
                $scope.hasContent = false;
                $scope.reply.title = '';
            } else {
                $scope.hasContent = true;
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
            } else {
                $scope.hide = true;
                $rootScope.$broadcast("event:newDiscussion");
            }
        }).error(function (data, status) {
                $log.info("ERROR retrieving protected resource: " + data + " status: " + status);
            });
    }

    $scope.replyTo = function (original) {
        if (!$rootScope.auth.isAuthenticated) {
            $rootScope.$broadcast($auth.event.signinRequired);
            return;
        }
        $scope.reply.show = true;
        if (original != null) {
            var content = "<p><blockquote>" + original + "</blockquote></p>" + "<p></p>";
            $scope.reply.message = content;
        } else {
            $scope.reply.message = null;
        }
    };

    $scope.submitReply = function () {
        //if ($scope.reply.message != '') {
            var reply = $scope.reply.message;
            var replyUrl = 'api/discussions/' + $scope.discussion.threadId;
            $http.post(replyUrl, { reply:reply }).success(function (data) {
                $scope.reply.show = false;
                $scope.reply.message = '';
                $scope.discussion.children.unshift(data);
            });
        /*} else {
            alert("enter a reply");
        } */
    };

    $scope.cancel = function () {
        $scope.reply.show = false;
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

    /*
     $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
     */
    if ($scope.pageType != "none") {
        loadContent();
    }

    $rootScope.$on($auth.event.signoutConfirmed, function () {
        if ($scope.$scope.pageType == "new") {
            $location.path('/discussion/all');
        }
    });

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
    $scope.hasContent = false;
    $scope.hide = ($routeParams.articleId === null);

    $scope.query = '';
    $scope.enterReply = "Reply to discussion";
    $scope.reply = {
        show:false,
        message:''
    };

    $scope.reply.title = '';

    if (!$rootScope.auth.isAuthenticated) {
        $location.path('/network/all');
    }

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

    $rootScope.$on($auth.event.signoutConfirmed, function () {
        $location.path('/discussion/all');
    });

    //fired by the view resource controller after it's loaded, by default this should hide the new reply until it's discovered that the discussion for that object doesn't exist yet
    $rootScope.$on('event:loadDiscussion', function ($event, $args) {
        $scope.hide = true;
        $scope.hasContent = true;
    });
}

ListDiscussions.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$auth', '$location'];
ViewDiscussion.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$auth', '$location'];
NewDiscussion.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$auth', '$location'];