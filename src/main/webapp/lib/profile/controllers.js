'use strict';

/* Controllers */

function ProfileCtrl($rootScope, $scope, $http, $routeParams, $location, $parse, Profile) {
    $scope.master = {};

    $scope.showSuccess = false;
    $scope.showError = false;
    $scope.showResetForm = true;
    $scope.recoveryAdress = '';

    if($routeParams.token){
        var data = {
            token: $routeParams.token
        };

        $http.post('/gc/api/utility/resetpassword/', data)
            .success(function(data, status, headers, config){
                $scope.isViewMode = false;
                $scope.isEditMode = false;
                $scope.isCreateMode = false;
                $scope.isResetPassMode = true;

                $scope.showSuccess = true;

            }
        ).error(function(data, status, headers, config){
                $scope.isViewMode = false;
                $scope.isEditMode = false;
                $scope.isCreateMode = false;
                $scope.isResetPassMode = true;

                $scope.showError = true;
            });
    }

    if($routeParams.profileId){
        var profile = Profile.get({profileId: $routeParams.profileId}, function(){
            $scope.isListMode = false
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
            $scope.isResetPassMode = false;

            $scope.profile = profile.content;
        });
    }else{
        $scope.isListMode = true
        $scope.isViewMode = false;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
        $scope.isResetPassMode = false;

        Profile.query(function(profiles){
            $scope.profiles = profiles.content;
        });
    }

    $scope.thumbnailURI = '';
    $scope.workInstitutionCreate = {};
    $scope.workInstitutionEdit = {};
    $scope.originalInstitution = '';
    $scope.eduSchoolName = [];

    $scope.edit = function(profile){
        $scope.master = angular.copy(profile);
        $scope.originalInstitution = profile.workHistory[0].businessName;

        $scope.profile.newPass = '';
        $scope.profile.newPassRepeat = '';

        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;
    }

    $scope.update = function(profile){
        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;

        if($scope.thumbnailURI !== ''){
            profile.thumbnail = $scope.thumbnailURI;
        }

        Profile.update({profileId: profile._id}, profile, function(response){
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;

            $scope.responseContent = response.content;
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.cancel = function(){
        $scope.isListMode = true
        $scope.isViewMode = false;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
        $scope.isResetPassMode = false;
    }

    $scope.create = function(){
        $scope.profile = {};

        $scope.profile.workHistory = [
            {
                "title": "",
                "businessName": "",
                "yearStarted": {
                    "hijri": "",
                    "gregorian": "",
                    "preference": "gregorian"
                },
                "yearFinished": {
                    "hijri": "",
                    "gregorian": "",
                    "preference": "gregorian"
                },
                workNotes: "",
                location: ""
            }
        ];

        $scope.profile.educationHistory = [
            {
                "schoolName" : '',
                "degree" : '',
                "fieldOfStudy" : '',
                "country" : "",
                "yearFrom": {
                    "hijri": "",
                    "gregorian": "",
                    "preference": "gregorian"
                },
                "yearTo": {
                    "hijri": "",
                    "gregorian": "",
                    "preference": "gregorian"
                },
                "edNotes": ""
            }
        ];

        $scope.profile.websites = [
            {
                "title" : '',
                "url" : ''
            }
        ];

        $scope.isListMode = false
        $scope.isViewMode = false;
        $scope.isEditMode = false;
        $scope.isCreateMode = true;
        $scope.isResetPassMode = false;
    }

    $scope.save = function(profile){
        $scope.newProfile = new Profile(profile);

        if($scope.thumbnailURI !== ''){
            $scope.newProfile.thumbnail = $scope.thumbnailURI;
        }

        $scope.newProfile.$save(function(response){
            $scope.profile._id = response.content._id;
            $scope.profile.thumbnail = response.content.thumbnail;

            $scope.isListMode = false
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
            $scope.isResetPassMode = false;

            $location.path('/profile/' + $scope.profile._id);

            $scope.responseContent = response.content;
        }, function(response){
            console.log('POST ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.delete = function(){
        var profile = Profile.delete({profileId: $scope.profile._id}, function(profile){
            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;
        }, function(response){
            console.log('DELETE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });

        $scope.profile = {};

        window.setTimeout(function(){
            profile.$query(function(profiles){
                $scope.profile = profiles.content[0];
            }, function(response){
                console.log('QUERY ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
            });
        }, 2000)
    }

    $scope.isUnchanged = function(member){
        return angular.equals(member, $scope.master);
    }

    $scope.addEdRow = function(){
        $scope.profile.educationHistory.push({
            "schoolName" : '',
            "degree" : '',
            "fieldOfStudy" : '',
            "country" : "",
            "yearFrom": {
                "hijri": "",
                "gregorian": "",
                "preference": "gregorian"
            },
            "yearTo": {
                "hijri": "",
                "gregorian": "",
                "preference": "gregorian"
            },
            "edNotes": ""
        });
    }

    $scope.removeEdRow = function(index){
        $scope.profile.educationHistory.splice(index, 1);
    }

    $scope.removeEdRowEdit = function(index){
        $scope.profile.educationHistory.splice(index, 1);
    }

    $scope.addContactRow = function(){
        $scope.profile.websites.push(
            {
                "title" : '',
                "url" : ''
            }
        );
    }

    $scope.removeContactRow = function(index){
        $scope.profile.websites.splice(index, 1);
    }

    $scope.addWorkRow = function(){
        $scope.profile.workHistory.push(
            {
                "title": "",
                "businessName": "",
                "yearStarted": {
                    "hijri": "",
                    "gregorian": "",
                    "preference": "gregorian"
                },
                "yearFinished": {
                    "hijri": "",
                    "gregorian": "",
                    "preference": "gregorian"
                },
                workNotes: "",
                location: ""
            }
        );
    }

    $scope.removeWorkRow = function(index){
        $scope.profile.workHistory.splice(index, 1);
    }

    $scope.list = function(){
        $scope.isListMode = true
        $scope.isViewMode = false;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
        $scope.isResetPassMode = false;

        $location.path('/profile');

        Profile.query(function(profiles){
            $scope.profiles = profiles.content;
        });
    }

    $scope.reset = function(){
        var data = {
            profileEmail: $scope.recoveryAddress
        }

        $http.post('/gc/api/utility/resettoken/', data)
            .success(function(data, status, headers, config){
                $scope.showResetForm = false;
                $scope.showSuccess = true;
            }
        ).error(function(data, status, headers, config){
                $scope.showError = true;
            });
    }

    $scope.closeSuccessAlert = function(){
        $scope.showSucess = false;
    }

    $scope.closeErrorAlert = function(){
        $scope.showError = false;
    }

    $scope.followUser = function(profileID) {
        var url = '/gc/api/follow/' + $rootScope.auth.principal.id + '/' + profileID;

        $http.post(url).success(function(data) {
            console.log("DATA RETURNED IS: ",data);
        })
    }
}

