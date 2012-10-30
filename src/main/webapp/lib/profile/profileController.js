/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 8/3/12
 * Time: 11:10 AM
 * To change this template use File | Settings | File Templates.
 */
function listProfiles($rootScope, $scope, $http, Profile, $window){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'faculty';
    });

    $scope.showModal = false;

    $scope.profileModal = {
        name: '',
        title: '',
        email: '',
        institution: '',
        location: '',
        thumbnail: '',
        education: {},
        notes: '',
        activity: {}
    }

    $scope.showProfileModal = function(profile){
        $scope.showModal = true;

        var thumbnail = profile.thumbnail === 'profiles-0000-0000-0000-000000000001' ?  'images/GCEE_image_profileMale_135x135.jpeg' : profile.thumbnail;
        var yearFinished = profile.workHistory[0].yearFinished.gregorian === '' ? 'present' : profile.workHistory[0].yearFinished.gregorian;

        $scope.profileModal = {
            name: profile.name.fullName,
            title: profile.workHistory[0].title,
            contact: {
                email: profile.accountEmail.address,
                website: {
                    title: profile.websites[0].title,
                    url: profile.websites[0].url
                }
            },
            institution: {
                name: profile.workHistory[0].businessName,
                location: profile.workHistory[0].location,
                yearStarted: profile.workHistory[0].yearStarted.gregorian,
                yearFinished: yearFinished
            },
            thumbnail: thumbnail,
            education: {
                name: profile.educationHistory[0].schoolName,
                fieldOfStudy: profile.educationHistory[0].fieldOfStudy,
                country: profile.educationHistory[0].country,
                yearFrom: profile.educationHistory[0].yearFrom.gregorian,
                yearTo: profile.educationHistory[0].yearTo.gregorian
            },
            notes: profile.about,
            activity: profile.activity
        }
    }

    Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });
}

function viewProfile($rootScope, $scope, $routeParams, $location, $timeout, $http, Profile){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
    });

    var profile = Profile.get({profileId: $routeParams.profileId},
        function(){
            if(profile.status === 400){
                $location.path('/error/404');
            }else{
                $scope.profile = profile.content;

                if($scope.profile.thumbnail === 'profiles-0000-0000-0000-000000000001' || $scope.profile.thumbnail === null){
                    $scope.profile.thumbnail = "http://dummyimage.com/160"
                }
            }
        }
    );

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

function createProfile($rootScope, $scope, $location, $http, Profile){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $scope.signupSuccess = false;
    $scope.profile = {};
    $scope.profile.accountEmail = {
        address: ''
    };

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

    $scope.save = function(profile){
        $scope.newProfile = new Profile(profile);
        $scope.newProfile.thumbnail = 'images/GCEE_image_profileMale_135x135.jpeg';

        $scope.newProfile.$save(function(response){
            //$scope.profile._id = response.content._id;
            //$scope.profile.thumbnail = response.content.thumbnail;

            var data = {
                profileId: response.content._id
            }

            $http.post('/gc/api/utility/verifyprofile/', data)
                .success(function(data, status, headers, config){
                    //$scope.showResetForm = false;
                    //$scope.showSuccess = true;
                    $scope.signupSuccess = true;
                })
                .error(function(data, status, headers, config){
                    console.log('POST VERIFY PROFILE ERROR!!!');
                });
            //$location.path('/network');
            $scope.responseContent = response.content;
        }, function(response){
            console.log('POST ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    };

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

function searchProfiles($scope, $location){
    $scope.searchProfiles = function(){
        $location.path('/search/profiles/' + $scope.profileSearchQuery);
    };
}