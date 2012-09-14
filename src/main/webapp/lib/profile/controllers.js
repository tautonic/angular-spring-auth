'use strict';

/* Controllers */

function ProfileCtrl($scope, $http, $routeParams, $location, Profile) {
    $scope.master = {};

    $scope.isViewMode = true;
    $scope.isEditMode = false;
    $scope.isCreateMode = false;

    Profile.query(function(profiles){
        $scope.profile = profiles.content[0];
    });

    //12d0b4eafca44976bcfed39cc1b9da41
    /*Profile.get({ profileId: '12d0b4eafca44976bcfed39cc1b9da41' }, function(profile){
        $scope.profile = profile.content;
    }, function(response){
        console.log('GET ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });*/

    //$scope.profile = Profile.get({ profileId: '12d0b4eafca44976bcfed39cc1b9da41' });

    /*Profile.email({ email: 'jhines@pykl.com' }, function(profile){
        $scope.profile = profile.content;
    }, function(response){
        console.log('GET PROFILE BY EMAIL ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });*/

    /*Profile.username({ username: 'jhines' }, function(profile){
        $scope.profile = profile.content;
    }, function(response){
        console.log('GET PROFILE BY USERNAME ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });*/

    $scope.edit = function(profile){
        $scope.master = angular.copy(profile);

        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;
    }

    $scope.update = function(profile){
        $scope.isViewMode = false;
        $scope.isEditMode = true;
        $scope.isCreateMode = false;

        var data = {
            "username"      : profile.username,
            "password"      : profile.password,
            "accountEmail"  : {
                "address"  : profile.accountEmail.address
            }
        }

        Profile.update({profileId: profile._id}, data, function(response){
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
        ajax: {
            url: "http://localhost:8080/gc/api/data/",
            dataType: 'json',
            data: function(term, page) {
                return {
                    q: term,
                    page_limit: 5
                };
            },
            results: function (data, page) { // parse the results into the format expected by Select2.
                return {results: data.universities};
            }
        }
    }
}

