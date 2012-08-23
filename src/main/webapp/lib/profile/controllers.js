'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location, Profile) {
    $scope.master = {};

    $scope.isViewMode = true;
    $scope.isEditMode = false;
    $scope.isCreateMode = false;

    /*Profile.query(function(profiles){
        $scope.profile = profiles.content[0];
    });*/

    //12d0b4eafca44976bcfed39cc1b9da41
    /*Profile.get({ profileId: '12d0b4eafca44976bcfed39cc1b9da41' }, function(profile){
        $scope.profile = profile.content;
    });*/

    //$scope.profile = Profile.get({ profileId: '12d0b4eafca44976bcfed39cc1b9da41' });

    Profile.email({ email: 'j@pykl.com' }, function(profile){
        $scope.profile = profile.content;
    });

    $scope.edit = function(member){
        $scope.master = angular.copy(member);

        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;
    }

    $scope.update = function(){
        Profile.update({profileId: $scope.profile._id}, $scope.profile, function(profile){
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
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
        newProfile.$save(function(response){
            $scope.profile._id = response.content._id;
        });

        $scope.isViewMode = true;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
    }

    $scope.delete = function(){
        var profile = Profile.delete({profileId: $scope.profile._id}, function(profile){
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
        });

        $scope.profile = {};

        window.setTimeout(function(){
            profile.$query(function(profiles){
                $scope.profile = profiles.content[0];
            });
        }, 2000)
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