'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location) {
    $scope.master = {};

    $scope.isViewMode = true;
    $scope.isEditMode = false;
    $scope.isCreateMode = false;

    /*$http.get('api/profiles/' + $routeParams.profileId).success(function(data){
        $scope.id = data.id;
        $scope.profile = data;
    });*/

    $scope.profile = {
        firstName:   'James',
        email:  'jhines@pykl.com'
    }

    $scope.edit = function(member){
        $scope.master = angular.copy(member);

        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;
    }

    $scope.update = function(){
        $http.put('api/profiles/' + $scope.profile.id, $scope.profile).success(function(data){
            $scope.id = data.id;
            $scope.profile;

            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
        });
        $scope.profile = Profile.update({profileId: $routeParams.profileId}, $scope.profile, function(data){
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;

            $scope.id = data.id;
        });
    }

    $scope.cancel = function(){
        $scope.profile = angular.copy($scope.master);

        $scope.id = $scope.master.id;
        $scope.isViewMode = true;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
    }

    $scope.create = function(){
        $scope.master = angular.copy($scope.profile);

        $scope.profile = {};

        $scope.isViewMode = false;
        $scope.isEditMode = false;
        $scope.isCreateMode = true;
    }

    $scope.save = function(){
        $http.post('api/profiles/', $scope.profile).success(function(data){
            $scope.id = data.id;
            $scope.profile;

            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
        });
    }

    $scope.delete = function(){
        $http.delete('api/profiles/' + $scope.profile.id).success(function(data){
            $scope.wasProfileDeleted = true;

            $scope.id = data.id;
            $scope.profile = data;

            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
        });
    }

    $scope.isUnchanged = function(member){
        return angular.equals(member, $scope.master);
    }

    $scope.asyncEmail = function(email){
        $http.get('api/profiles/asyncEmail/' + email).success(function(data){
            console.log(data);
        }).error(function(data, status){
            console.log(status);
        });
    }


}