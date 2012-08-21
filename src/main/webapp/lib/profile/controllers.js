'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location, Profile) {
    $scope.master = {};

    $scope.isViewMode = true;
    $scope.isEditMode = false;
    $scope.isCreateMode = false;

    var profiles = Profile.query(function(){
        $scope.profile = profiles.content[0];
    });

    $scope.edit = function(member){
        $scope.master = angular.copy(member);

        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;
    }

    $scope.update = function(){
        Profile.update({profileId: $scope.profile._id}, $scope.profile, function(data){
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
        });

        var profiles = Profile.query(function(){
            $scope.profile = profiles.content[0];
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
        var newProfile = new Profile($scope.profile);
        newProfile.$save();

        $scope.isViewMode = true;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
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