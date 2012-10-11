/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 8/3/12
 * Time: 11:10 AM
 * To change this template use File | Settings | File Templates.
 */
function listProfiles($scope, Profile){
    Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });
}

function viewProfile($scope, $routeParams, Profile){
    var profile = Profile.get({profileId: $routeParams.profileId}, function(){
        $scope.profile = profile.content;

        if($scope.profile.thumbnail === 'profiles-0000-0000-0000-000000000001'){
            $scope.profile.thumbnail = "http://dummyimage.com/160"
        }
    });

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
}

function createProfile($scope, Profile){
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
}

function updateProfile($scope, $routeParams, Profile){
    $scope.profile = {};

    var profile = Profile.get({profileId: $routeParams.profileId}, function(){
        $scope.profile = profile.content;

        if($scope.profile.thumbnail === 'profiles-0000-0000-0000-000000000001'){
            $scope.profile.thumbnail = "http://dummyimage.com/500x300&text=Drag and drop files here"
        }
    });

    $scope.profile.newPass = '';
    $scope.profile.newPassRepeat = '';

    $scope.update = function(profile){
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
}

function deleteProfile($scope, $http, $routeParams, $location, $parse, Profile){

}
