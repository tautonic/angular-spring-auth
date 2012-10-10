'use strict';

function AdminCtrl($rootScope, $scope, $routeParams, $http, $log, $location) {
    var url = 'api/admin/users';
    var backup = {};

    setupScope();
    loadContent();

    function setupScope() {
        $scope.pageType = "users";
        $scope.isLoaded = false;
    }

    function loadContent() {
        $http.get(url).success(function (data) {
            $scope.users = data.content;
            $scope.isLoaded = true;
        });
    }

    $scope.saveEdits = function(user) {
        $http.put(url, user).success(function (data) {
            user.editing = false;
        });
    }

    $scope.editUser = function(user) {
        backup = angular.copy(user);

        user.editing = true;
    }

    $scope.cancelEdit = function(user) {
        user.name = backup.name;
        user.workHistory = backup.workHistory;
        user.accountEmail = backup.accountEmail;

        user.editing = false;
    }

    $scope.resetPassword = function() {
        var data = {
            token: "token"
        };

        $http.post('/gc/api/utility/resetpassword/', data).success(function(data){
            alert("Password reset successful.");
        });
    }

    $scope.banUser = function(user) {
        if(confirm("Are you sure you want to ban "+user.name.fullName+"?")) {
            alert("User is banned");
        }
    }
}