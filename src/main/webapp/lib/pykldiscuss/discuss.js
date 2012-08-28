'use strict';

function DiscussionCtrl( $rootScope, $scope, $routeParams, $http, $log, $location ) {
    var url = 'api/discussion/';
    //this check is needed to handle things like discussions connected with articles
    var id = $routeParams.discussionId || $routeParams.articleId || "new";

    $scope.reply = {
        show: false,
        message: ''
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
        $http.get( url ).success( function (data) {
            if(id != "all")
            {
                $scope.discussion = data[0];
            } else {
                $scope.discussion = data;
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
                message: $scope.reply.message
            }]
        });
        $http.post('api/discussion/new', $scope.discussion).success(function(data) {
            if(data.newId !== false)
            {
                $location.path('/discussion/'+data.newId);
            } else {
                alert("There was an error.");
            }
        });

    }

    $scope.submitReply = function() {
        if($scope.reply.message != '') {
            var reply = $scope.reply.message;
            $scope.reply.show = false;
            $scope.reply.message = '';
            $http.post(url, { reply: reply }).success(function(data) {
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