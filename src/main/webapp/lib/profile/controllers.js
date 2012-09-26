'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location, $parse, Profile) {
    $scope.master = {};

    $scope.isViewMode = true;
    $scope.isEditMode = false;
    $scope.isCreateMode = false;
    $scope.modalShown = false;

    $scope.thumbnailURI = '';
    $scope.workInstitutionCreate = {};
    $scope.workInstitutionEdit = {};
    $scope.originalInstitution = '';

    Profile.query(function(profiles){
        $scope.profile = profiles.content[0];
    });

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

        profile.thumbnail = $scope.thumbnailURI;

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
        $scope.profile = angular.copy($scope.master);
        $scope.id = $scope.master.id;
        $scope.isViewMode = true;
        $scope.isEditMode = false;
        $scope.isCreateMode = false;
    }

    $scope.create = function(profile){
        $scope.master = angular.copy(profile);

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

        $scope.isViewMode = false;
        $scope.isEditMode = false;
        $scope.isCreateMode = true;
    }

    $scope.save = function(profile){
        profile.educationHistory.forEach(function(school){
            school.schoolName = school.schoolName.text;
        });

        $scope.newProfile = new Profile(profile);
        $scope.newProfile.thumbnail = $scope.thumbnailURI;

        $scope.newProfile.$save(function(response){
            $scope.profile._id = response.content._id;
            $scope.profile.thumbnail = response.content.thumbnail;

            $scope.isViewMode = true;
            $scope.isEditMode = false;
            $scope.isCreateMode = false;

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

    $scope.asyncEmail = function(email){
        $http.get('api/profiles/asyncEmail/' + email).success(function(data){
            console.log(data);
        }).error(function(data, status){
            console.log(status);
        });
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

    $scope.yearToChanged = function(){
        //console.log($scope.profile.workHistory.yearTo.gregorian);
    }

    $scope.yearFinishedChanged = function(){
        //console.log($scope.profile)
    }

    $scope.workInstitutionChangedCreate = function(){
        if($scope.workInstitutionCreate !== null){
            $scope.profile.workHistory[0].businessName = $scope.workInstitutionCreate.text;
        }
    }

    $scope.workInstitutionChangedEdit = function(){
        if($scope.profile.workHistory[0].businessName !== null){
            $scope.profile.workHistory[0].businessName = $scope.profile.workHistory[0].businessName.text;
        }else{
            $scope.profile.workHistory[0].businessName = $scope.originalInstitution;
        }
    }

    $scope.eduInstitutionChangedEdit = function(index){
        if($scope.profile.educationHistory[index].schoolName !== null){
            $scope.profile.educationHistory[index].schoolName = $scope.profile.educationHistory[index].schoolName.text;
        }else{
            $scope.profile.educationHistory[index].schoolName = $scope.originalInstitution;
        }
    }

    $scope.getUniversityData = function () {
        return { // instead of writing the function to execute the request we use Select2's convenient helper
            url: "https://maps.googleapis.com/maps/api/place/autocomplete/json?",
            dataType: 'json',
            data: function(term, page) {
                return {
                    q: "input=" + term + "&types=establishment&sensor=true&key=AIzaSyAGbAUbk7G-U0LS7t3D5oQyME9REnTfFRI",
                    page_limit: 5
                };
            },
            results: function (data, page) { // parse the results into the format expected by Select2.
                console.log("HELLO? ",data);
                return {results: data.universities};
            }
        };
    }

    $scope.selectConfig = {
        allowClear: true,
        minimumInputLength: 3,
        placeholder: 'Select an Institution'
    }
}

