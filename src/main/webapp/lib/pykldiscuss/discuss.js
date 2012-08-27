'use strict';

function DiscussionCtrl( $rootScope, $scope, $routeParams, $http, $log, $location ) {
    var url = 'api/discussion/';
    //this check is needed to handle things like discussions connected with articles
    var id = $routeParams.discussionId || $routeParams.articleId || "new";

    $scope.reply = {
        show: false,
        content: ''
    };

    if(("new"===id) && (!$rootScope.auth.isAuthenticated))
    {
        $location.path('/discussion/all');
    }

    //$rootScope.$watch('auth.isAuthenticated()', function(newValue, oldValue) { console.log('you are now (not) authenticated', newValue, oldValue, $rootScope.auth.getUsername()); });

    switch(id)
    {
        case "new":
            $scope.reply.title = '';
            $scope.new = true;
            url = url + "new";
            break;
        case "all":
            $scope.allThreads = true;
            url = url + "all";
            break;
        default:
            $scope.singleThread = true;
            url = url + id;
    }

    function loadContent() {
        $http.get( url ).success( function (data, status) {
            var discussion = data;
            $scope.discussion = discussion;
            console.log("DSICUSSION: "+$scope.discussion.message);
        }).error(function(data, status) {
                $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });
    }

    $scope.replyTo = function(original) {
        $scope.reply.show = true;
        if(original != null) {
            $scope.reply.content = "[quote]" + original + "[/quote]";
        } else {
            $scope.reply.content = '';
        }
    }
    //$auth.getPrincipal();
    $scope.createDiscussion = function() {
        if(typeof($scope.discussion) === "undefined")
        {
            $scope.discussion = [];
        }
        $scope.discussion.push(
        {
            title: $scope.reply.title,
            posts: [{
                owner: {
                    username: 'bob',//$rootScope.auth.getUsername(),
                    picture: "http://localhost:8080/gc/images/40x40.gif"
                },
                content: $scope.reply.content
            }]
        });
        $http.post('api/discussion/new', $scope.discussion).success(function(data) {
            $location.path('/discussion/'+data.newId);
        });

    }

    $scope.submitReply = function() {
        if($scope.reply.content != '') {
            var reply = $scope.reply.content;
            $scope.reply.show = false;
            $scope.reply.content = '';
            $http.post(url, { reply: reply }).success(function(data) {
                $scope.discussion.posts.push(data);
            });
        } else {
            alert("enter a reply");
        }
    }

    $scope.cancel = function() {
        $scope.reply.show = false;
    }

    $scope.canEdit = function(post) {
        return (post.owner.username == $rootScope.auth.getUsername());
    }

    $scope.edit = function(post) {
        post.edited = post.content;
        post.edit = true;
    }

    $scope.cancelEdit = function(post) {
        post.edit = false;
        delete post.edited;
    }

    $scope.editPost = function(post) {
        post.content = post.edited;
        delete post.edited;
        post.edit = false;
        $http.put(url + "/" + post.id, post).success(function(data) {
            console.log("edit saved successfully to server");
        });
    }
    /*
    $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
    */
    if(!$scope.new) {
        loadContent();
    }

    $rootScope.$on('event:logoutConfirmed', function() {
        if($scope.new) {
            $location.path('/discussion/all');
        }
    });
}

ResourceCtrl.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$location', '$auth'];