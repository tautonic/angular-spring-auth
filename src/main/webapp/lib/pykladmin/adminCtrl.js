'use strict';

function AdminCtrl($rootScope, $scope, $routeParams, $http, $log, $location, Profile) {
    /*var url = 'api/admin/users';
    var backup = {};

    setupScope();
    loadContent();

    function setupScope() {
        $scope.pageType = "users";
        $scope.isLoaded = false;
    }

    function loadContent() {
        $http.get(url).success(function (data) {
            $scope.users = data.content;
            $scope.isLoaded = true;
        });
    }

    $scope.saveEdits = function(user) {
        $http.put(url, user).success(function (data) {
            user.editing = false;
        });
    }

    $scope.editUser = function(user) {
        backup = angular.copy(user);

        user.editing = true;
    }

    $scope.cancelEdit = function(user) {
        user.name = backup.name;
        user.workHistory = backup.workHistory;
        user.accountEmail = backup.accountEmail;

        user.editing = false;
    }

    $scope.resetPassword = function() {
        var data = {
            token: "token"
        };

        $http.post('/gc/api/utility/resetpassword/', data).success(function(data){
            alert("Password reset successful.");
        });
    }

    $scope.banUser = function(user) {
        if(confirm("Are you sure you want to ban "+user.name.fullName+"?")) {
            alert("User is banned");
        }
    }*/
}

function adminUsersList($rootScope, $scope, $routeParams, $http, $log, $location, Profile){
    $scope.adminUsers = true;
    $scope.adminArticles = false;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    /*Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });*/

    $http.get('/gc/api/profiles/admin').
        success(function(data, status, headers, config){
            console.log(data);
            $scope.profiles = data.content;
            $scope.facets = data.facets;

            // create a scope object for each facet term
            for(var facet in $scope.facets){
                //var term =
                $scope.facets[facet].selected = false;
            }
        }).
        error(function(data, status, headers, config){

        });

    $scope.filtered = function(checked, id){
        var status = [];

        $scope.allTypes = false;
        console.log('search ' + id + ' is ' + checked);

        for(var facet in $scope.facets){
            if($scope.facets[facet].selected === true){
                status.push($scope.facets[facet].term);
            }
        }

        status = status.join(' ');

        var data = {
            status: status
        };

        //dataType = [];
        $http.post('api/profiles/admin/status/', data)
            .success(function(response){
                console.log('Success! Search request was successful');
                $scope.profiles = response.content;
            })
            .error(function(){
                console.log('Error! Search request was successful');
            });
    };
}

function adminUsersNew($rootScope, $scope, $routeParams, $http, $log, $location, Profile){
    $scope.adminUsers = false;
    $scope.adminArticles = false;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.profile = {};

    $scope.profile.name = {
        given: '',
        surname: ''
    }

    $scope.userCanEdit = true;
    $scope.profile.thumbnail = 'images/GCEE_image_profileMale_135x135.jpeg';
    $scope.profile.accountEmail = {
        address: ''
    };

    $scope.profile.websites = [{
        title: '',
        url: ''
    }];

    $scope.profile.educationHistory = [{
        schoolName: '',
        fieldOfStudy: '',
        country: '',
        degree: '',
        edNotes: '',
        yearFrom: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        },
        yearTo: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        }
    }];

    $scope.profile.workHistory = [{
        title: '',
        businessName: '',
        location: '',
        workNotes: '',
        yearStarted: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        },
        yearFinished: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        }
    }];

    $scope.save = function(profile){
        $scope.newProfile = new Profile(profile);

        $scope.newProfile.$save(function(response){
            var data = {
                profileId: response.content._id
            }

            $http.post('/gc/api/utility/verifyprofile/', data)
                .success(function(data, status, headers, config){

                })
                .error(function(data, status, headers, config){
                    console.log('POST VERIFY PROFILE ERROR!!!');
                });

            $location.path('/profiles/view/' + response.content._id);
        }, function(response){
            console.log('POST ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    };

    $scope.cancel = function(){
        $location.path('/admin/users');
    }
}

function adminArticlesList($rootScope, $scope, $routeParams, $http, $log, $location){
    $scope.adminUsers = false;
    $scope.adminArticles = true;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';
}

