/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 8/3/12
 * Time: 11:10 AM
 * To change this template use File | Settings | File Templates.
 */
function listProfiles($rootScope, $scope, $location, $http, Profile, $window){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'faculty';
    });

    //$rootScope.showModal = false;

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

    $scope.$on('hideModal', function(event){
        event.currentScope.showModal = false;
    });

    $scope.$on('$routeChangeStart', function(event){
        event.currentScope.showModal = false;
        //console.log('Route change start event fired!!!');
    });

    $scope.showProfileModal = function(profile){
        $scope.showModal = true;

        var thumbnail = profile.thumbnail === 'profiles-0000-0000-0000-000000000001' ?  'images/GCEE_image_profileMale_135x135.jpeg' : profile.thumbnail;

        var website = {
            title: '',
            url: ''
        };

        if(!profile.websites){
            profile.websites = [{
                title: '',
                url: ''
            }];
        }

        if(!profile.educationHistory){
            profile.educationHistory = [{
                schoolName: '',
                fieldOfStudy: '',
                country: '',
                yearFrom: {
                    gregorian: ''
                },
                yearTo: {
                    gregorian: ''
                }
            }];
        }

        if(!profile.workHistory){
            profile.workHistory = [{
                businessName: '',
                location: '',
                yearStarted: {
                    gregorian: ''
                },
                yearFinished: {
                    gregorian: ''
                }
            }];
        }

        var yearFinished = profile.workHistory[0].yearFinished.gregorian === '' ? 'present' : profile.workHistory[0].yearFinished.gregorian;

        $scope.profileModal = {
            id: profile._id,
            name: profile.name.given + ' ' + profile.name.surname,
            title: profile.workHistory[0].title || '',
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
            activity: profile.activity,
            isUserFollowing: profile.isUserFollowing
        }
    }

    $scope.closeProfileModal = function(path) {
        $scope.showModal = false;
        if(path !== undefined) {
            $location.path(path + $scope.profileModal.id);
        }
    }

    $scope.followUser = function(id) {
        $http.post('/gc/api/follow/'+$rootScope.auth.principal.id + '/' + id).success(function(data) {
            $scope.profileModal.isUserFollowing = data.success;
        });
    }

    $scope.canEditProfile = function() {
        return ( ($rootScope.auth.id == $scope.profileModal.id) || ($rootScope.auth.isUserInRole("ROLE_ADMIN")) );
    }

    Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });
}

function viewProfile($rootScope, $scope, $routeParams, $location, $timeout, $http, Profile){
    $scope.profile = {};
    $scope.master = {};

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'none';
    });

    var profile = Profile.get({profileId: $routeParams.profileId},
        function(){
            if(profile.status === 400){
                $location.path('/error/404');
            }else{
                $scope.showHideContact = false;
                $scope.showHideInstitution = false;
                $scope.showHideEducation = false;
                $scope.showHideNotes = false;
                $scope.profile = profile.content;
                $scope.master = angular.copy($scope.profile);
            }
        }
    );

    $scope.updateContactInfo = function(profile){
        Profile.update({profileId: profile._id}, profile, function(response){
            $scope.showHideContact = false;
            $scope.profile = response;
            $scope.responseContent = response;
            $scope.master = angular.copy($scope.profile);
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    };

    $scope.cancelContactInfoUpdate = function(){
        $scope.showHideContact = false;
        $scope.profile = $scope.master;
    };

    $scope.updateInstitutionInfo = function(profile){
        Profile.update({profileId: profile._id}, profile, function(response){
            $scope.showHideInstitution = false;
            $scope.profile = response;
            $scope.responseContent = response;
            $scope.master = angular.copy($scope.profile);
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.cancelInstitutionInfoUpdate = function(){
        $scope.showHideInstitution = false;
        $scope.profile = $scope.master;
    }

    $scope.updateEducationInfo = function(profile){
        Profile.update({profileId: profile._id}, profile, function(response){
            $scope.showHideEducation = false;
            $scope.profile = response;
            $scope.responseContent = response;
            $scope.master = angular.copy($scope.profile);
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.cancelEducationInfoUpdate = function(){
        $scope.showHideEducation = false;
        $scope.profile = $scope.master;
    }

    $scope.updateNotes = function(profile){
        Profile.update({profileId: profile._id}, profile, function(response){
            $scope.showHideNotes = false;
            $scope.profile = response;
            $scope.responseContent = response;
            $scope.master = angular.copy($scope.profile);
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    };

    $scope.cancelNotesUpdate = function(){
        $scope.showHideNotes = false;
        $scope.profile = $scope.master;
    };

    $scope.updateThumbnailUri = function(profile){
        Profile.update({profileId: profile._id}, profile, function(response){
            $scope.profile = response;
            $scope.responseContent = response;
            $scope.master = angular.copy($scope.profile);
        }, function(response){
            $scope.responseContent = 'UPDATE FAILED WITH AN ERROR OF: ' + response.status;
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
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