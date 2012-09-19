'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location, Profile) {
    $scope.master = {};

    $scope.isViewMode = true;
    $scope.isEditMode = false;
    $scope.isCreateMode = false;

    $scope.uploadDisabled = true;

    Profile.query(function(profiles){
        $scope.profile = profiles.content[0];
    });

    $scope.edit = function(profile){
        $scope.master = angular.copy(profile);

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

        $scope.profile.educationHistory = [
            {
                "schoolName" : '',
                "degree" : '',
                "fieldOfStudy" : ''
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
        $scope.newProfile = new Profile(profile);
        $scope.newProfile.$save(function(response){
            $scope.profile._id = response.content._id;

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
            "fieldOfStudy" : ''
        });
    }

    $scope.removeEdRow = function(index){
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

    $scope.getUniversityData = function () {
        return { // instead of writing the function to execute the request we use Select2's convenient helper
            url: "http://localhost:8080/gc/api/data/",
            dataType: 'jsonp',
            data: function(term, page) {
                return {
                    q:term,
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
        placeholder: 'Select an institution'
    }
}

