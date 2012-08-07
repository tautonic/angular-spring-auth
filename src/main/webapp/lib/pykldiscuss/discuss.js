'use strict';

function DiscussionCtrl( $rootScope, $scope, $routeParams, $http, $log ) {
    //this check is needed to handle things like discussions connected with articles
    var id = $routeParams.discussionId || $routeParams.articleId || "new";

    var url = 'api/discussion/'+id;
    $scope.reply = {
        show: false,
        content: ''
    };

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

ResourceCtrl.$inject = ['$rootScope', '$scope', '$routeParams', '$http', '$log'];