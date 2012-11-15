'use strict';

/* Controllers */


function HomepageController($rootScope, $scope, $http, $location, $route) {
    $rootScope.siteQuery = '';
    $rootScope.faculty_query = '';
    $rootScope.content_query = '';
    $rootScope.discussion_query = '';

    $http.get("api/utility/getquote").success(function(data) {
        $scope.quote = data.quote;
    });

    $http.get('api/article/all/news').success(function(data) {
        $scope.articles = data;
    })

    var options = {
        data: JSON.stringify({
            filters: "likes comments discussions collaborators ideas companies profiles spMessages"
        })
    };

    $http.get('api/notifications?filters=likes comments discussions collaborators ideas companies profiles spMessages', options).success(function(data) {
        $scope.stream = data;
    });

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'home';
        $rootScope.about = 'home';
    });

    $scope.isEmpty = function () {
        return (($scope.stream) && ($scope.stream.itemCount === 0));
    };

    $scope.signup = function() {
        $location.path("/signup/"+$scope.signupEmail);
    }
}

function SiteSearchController($rootScope, $scope, $location){
    $scope.searchSite = function(){
        $location.path('/search/site/' + $scope.siteQuery);
        openSearch();
        $scope.siteQuery = '';
    };
}

function searchDiscussionsController($scope, $location){
    $scope.searchDiscussions = function(){
        $location.path('/search/discussions/' + $scope.query);
    }
}

function facultyFellows($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'faculty';
        $rootScope.about = 'none';
    });
}

function errorController($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = '404';
    });
}

function error500Controller($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = '500';
    });
}

function verifyEmailController($rootScope, $scope, $routeParams, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $http.get('api/utility/verifyemail/' + $routeParams.token)
        .success(function(data, status, headers, config){

        })
        .error(function(data, status, headers, config){
            console.log('TOKEN VERIFICATION ERROR!!!');
        });
}

function forgotUsernameController($rootScope, $scope, $location, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $scope.send = function(){
        $http.post('api/utility/sendusername/' + $scope.email)
            .success(function(data, status, headers, config){
                $location.path('/usernamesendsuccess');
            })
            .error(function(data, status, headers, config){
                console.log('SEND USERNAME ERROR!');
            });
    }
}

/**
 * Allows the user to input their email address and get an email which will (eventually) reset their passwords
 * @param $rootScope
 * @param $scope
 * @param $location
 * @param $http
 */
function forgotPasswordController($rootScope, $scope, $location, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $scope.send = function(){
        var data = {
            profileEmail: $scope.email
        }

        $http.post('/gc/api/utility/resettoken/', data)
            .success(function(data, status, headers, config){
                if(data.success) {
                    $location.path('/passswordsendsuccess');
                } else {
                    $scope.showError = true;
                }
            });
    }
}

/**
 * After receiving an email to reset their passwords, users go to the link here and this will actually reset their passwords, provided the token is still valid
 * @param $rootScope
 * @param $scope
 * @param $location
 * @param $http
 */
function resetPasswordController($rootScope, $scope, $routeParams, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';
    $scope.resetStatus = "waiting";

    var data = {
        token: $routeParams.token
    }

    $http.post('/gc/api/utility/resetpassword/', data)
        .success(function(data, status, headers, config){
            if(data.success) {
                $scope.resetStatus = "success";
            } else {
                $scope.resetStatus = "error";
            }
        });
}

/**
 * Show the form for activating account, or resending the verification email.
 * @param $rootScope
 * @param $scope
 * @param $location
 * @param $http
 */
function activateAccountController($rootScope, $scope, $location, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';
    $scope.resetStatus = "waiting";

    $scope.activate = function() {
        $location.path('verifyemail/'+$scope.code);
    }

    $scope.resend = function() {
        $http.get('/gc/api/utility/resendvalidationcode/' + $scope.email)
            .success(function(data){
                if(data.success) {
                    $scope.resetStatus = "success";
                } else {
                    $scope.resetStatus = "error";
                }
            });
    }
}

function servicesProgramsController($rootScope, $scope, $routeParams, $location){
    $rootScope.about = 'service';
    $rootScope.service = $routeParams.service;

    $scope.location = $location;

    //$rootScope.serviceTitle = 'Access To Babson Curriculum';

    switch($routeParams.service){
        case 'access':
            $rootScope.serviceTitle = 'Access To Babson Curriculum';
            break;
        case 'facultydev':
            $rootScope.serviceTitle = 'Faculty Development';
            break;
        case 'nextopp':
            $rootScope.serviceTitle = 'Next Opportunity';
            break;
        case 'handbook':
            $rootScope.serviceTitle = 'Handbook';
            break;
        case 'entrepreneurship':
            $rootScope.serviceTitle = 'Entrepreneurship Center Development';
            break;
        case 'gceemsce':
            $rootScope.serviceTitle = 'GCEE MSCE';
            break;
    }
}

//i don't think this is being used anywhere.....
function MyCtrl2( $rootScope, $scope, $http, $log ) {
	$scope.protected = 'Not loaded';

	function ping() {
		$http.get( 'api/ping' ).success( function ( data ) {
			$log.info( 'Successfully retrieved protected resource.' );
			$scope.protected = data;
		} );
	}

	ping();
}
HomepageController.$inject = ['$rootScope', '$scope', '$http', '$location'];
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


