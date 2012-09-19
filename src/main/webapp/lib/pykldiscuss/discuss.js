'use strict';
/*
reconfigure to be more testable:
default controller to load all discussions
use one single $scope variable to control which view is displayed
stick as much code into functions as possible
 */
function DiscussionCtrl( $rootScope, $scope, $routeParams, $http, $log, $location ) {
    var url = 'api/discussions/';

    setupScope();

    function setupScope() {
        $scope.enterReply = "Reply to discussion";
        $scope.reply = {
            show: false,
            message: ''
        };
        $scope.isLoaded = false;

        if($routeParams) {
            $scope.pageType = $routeParams.discussionId || "all";

            //this check is needed to handle things like discussions connected with articles
            if($routeParams.articleId) {
                $scope.pageType = "byParent/" + $routeParams.articleId;
                $scope.hasContent = false;
                $scope.reply.title = '';
            } else {
                $scope.hasContent = true;
            }

            switch($scope.pageType)
            {
                case "none":
                    break;
                case "new":
                    $scope.isLoaded = true;
                    $scope.reply.title = '';
                    url = url + "new";
                    break;
                case "all":
                    url = url + "all";
                    break;
                default:
                    url = url + $scope.pageType;
                    $scope.pageType = "single";
                    break;
            }
        } else {
            $scope.pageType = "all";
            url = url + "all";
        }

        if(("new"===$scope.pageType) && (!$rootScope.auth.isAuthenticated))
        {
            $location.path('/network/all');
        }
        //$rootScope.$watch('auth.isAuthenticated()', function(newValue, oldValue) { console.log('you are now (not) authenticated', newValue, oldValue, $rootScope.auth.getUsername()); });
    }

    function loadContent() {
        if($routeParams.articleId === "none") {
            $scope.pageType = "none";
            $scope.isLoaded = true;
            return;
        }
        $http.get( url ).success( function (data) {
            if(data !== "false")
            {
                if($scope.pageType != "all")
                {
                    $scope.discussion = data[0];
                } else {
                    $scope.discussion = data;
                }
                $scope.isLoaded = true;
            } else {
                $scope.pageType = "new";
                $scope.reply.title = $rootScope.title;
            }
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

    $scope.replyTo = function(original) {
        $scope.reply.show = true;
        if(original != null) {
            $scope.reply.message = "[quote]" + original + "[/quote]";
        } else {
            $scope.reply.message = '';
        }
    }

    $scope.createDiscussion = function() {
        var newPost = {
            title: $scope.reply.title,
            parentId: ($routeParams.articleId || null),
            posts: [{
                owner: {
                    username: 'bob',//$rootScope.auth.getUsername(),
                    picture: "http://localhost:8080/gc/images/40x40.gif"
                },
                message: $scope.reply.message
            }]
        };

        $http.post('api/discussions/new', newPost).success(function(data) {

            if(data.success === true) {
                url = 'api/discussions/byParent/' + $routeParams.articleId;
                $scope.pageType = "single";
                loadContent();
            } else {
                if(data.newId !== false)
                {
                    $location.path('/network/'+data.newId);
                } else {
                    alert("There was an error.");
                }
            }
        });
    }

    $scope.submitReply = function() {
        if($scope.reply.message != '') {
            var reply = $scope.reply.message;
            var replyUrl = 'api/discussions/' + $scope.discussion.threadId;
            $http.post(replyUrl, { reply: reply }).success(function(data) {
                $scope.reply.show = false;
                $scope.reply.message = '';
                $scope.discussion.children.unshift(data);
            });
        } else {
            alert("enter a reply");
        }
    }

    $scope.cancel = function() {
        $scope.reply.show = false;
    }

    $scope.canEdit = function(post) {
        if(post === undefined)
        {
            return false;
        }

        return (post.creator.username == $rootScope.auth.principal);
    }

    $scope.edit = function(post) {
        post.edited = post.message;
        post.edit = true;
    }

    $scope.cancelEdit = function(post) {
        post.edit = false;
        delete post.edited;
    }

    $scope.editPost = function(post) {
        post.message = post.edited;
        delete post.edited;
        post.edit = false;
        $http.put(url + "/" + post._id, post).success(function(data) {
            console.log("edit saved successfully to server, url: "+url+"/"+post._id);
        });
    }

    $scope.noDiscussions = function() {
        return (($scope.discussion) && ($scope.discussion.length === 0));
    }
    /*
    $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
    */
    if(($scope.pageType != "new") && ($scope.pageType != "none")) {
        loadContent();
    }

    $rootScope.$on('event:logoutConfirmed', function() {
        if($scope.$scope.pageType == "new") {
            $location.path('/discussion/all');
        }
    });

    $rootScope.$on('event:loadDiscussion', function($event, $args) {
        $routeParams.articleId = $args.discussionId;
        url = 'api/discussions/';
        setupScope();
        loadContent();
    })
}