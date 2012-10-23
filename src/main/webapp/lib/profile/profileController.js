/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 8/3/12
 * Time: 11:10 AM
 * To change this template use File | Settings | File Templates.
 */
function listProfiles($rootScope, $scope, Profile){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'faculty';
    });

    Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });
}

function viewProfile($rootScope, $scope, $routeParams, $location, $timeout, $http, Profile){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
    });

    var profile = Profile.get({profileId: $routeParams.profileId}, function(){
        $scope.profile = profile.content;

        if($scope.profile.thumbnail === 'profiles-0000-0000-0000-000000000001' || $scope.profile.thumbnail === null){
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

    $scope.delete = function(profile){
        Profile.delete({profileId: profile._id}, function(){
            $timeout(function(){
                $location.path('/profiles/');
            }, 1000);

        }, function(response){
            $scope.responseContent = 'DELETE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('DELETE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.followUser = function(id) {
        $http.post('/gc/api/follow/'+$rootScope.auth.principal.id + '/' + id).success(function(data) {
            $scope.profile.isUserFollowing = data.success;
        });
    }
}

function createProfile($scope, $location, Profile){
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

    $scope.save = function(profile){
        $scope.newProfile = new Profile(profile);

        if($scope.thumbnailURI !== ''){
            $scope.newProfile.thumbnail = $scope.thumbnailURI;
        }

        $scope.newProfile.$save(function(response){
            $scope.profile._id = response.content._id;
            $scope.profile.thumbnail = response.content.thumbnail;

            $location.path('/profiles/view/' + $scope.profile._id);

            $scope.responseContent = response.content;
        }, function(response){
            console.log('POST ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
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

}

function updateProfile($scope, $routeParams, $location, Profile){
    $scope.profile = {};
    $scope.master = {};

    var profile = Profile.get({profileId: $routeParams.profileId}, function(){
        $scope.profile = profile.content;
        $scope.master = angular.copy($scope.profile);

        if($scope.profile.thumbnail === 'profiles-0000-0000-0000-000000000001' || $scope.profile.thumbnail === null){
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
            $scope.responseContent = response.content;

            $location.path('/profiles/view/' + profile._id);
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    };

    $scope.isUnchanged = function(profile){
        return !angular.equals(profile, $scope.master);
    };

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

}