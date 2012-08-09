'use strict';

function DiscussionCtrl( $rootScope, $scope, $routeParams, $http, $log, $location, $auth ) {
    //this check is needed to handle things like discussions connected with articles
    var id = $routeParams.discussionId || $routeParams.articleId || "new";

    var url = 'api/discussion/'+id;
    $scope.reply = {
        show: false,
        content: '',
        isLoggedIn: $auth.isAuthenticated(),
        username: $scope.$apply($auth.getPrincipal().then(function(data) {
            $log.info("SETTING USERNAME TO: "+data.principal);
            $scope.username = data.principal;
        }))
    };
    if(id=="new")
    {
        $scope.reply.title = '';
        $scope.new = true;
    } else {
        $scope.new = false;
    }

    function loadContent() {
        $http.get( url ).success( function (data, status) {
            $scope.discussion = data;
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

    $scope.createDiscussion = function() {
        $scope.discussion.posts.push({
            owner: {
                username: $auth.getPrincipal(),
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: $scope.reply.content
        });
        $scope.discussion.title = $scope.reply.title;
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

    $rootScope.$on('event:loginConfirmed', function() { loadContent(); });
    $rootScope.$on('event:logoutConfirmed', function() { loadContent(); });

    loadContent();
}

ResourceCtrl.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$location', '$auth'];