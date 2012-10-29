'use strict';

/* Controllers */


function HomepageController($rootScope, $scope, $http, $location, $route) {
    $rootScope.siteQuery = '';
    $rootScope.faculty_query = '';
    $rootScope.content_query = '';
    $rootScope.discussion_query = '';

    $http.get("api/getquote").success(function(data) {
        $scope.quote = data.quote;
    });

    $http.get('api/article/all/news').success(function(data) {
        console.log("ARTICLES RETURNED: ",data);
        $scope.articles = data;
    })

    var options = {
        data: JSON.stringify({
            filters: "likes comments discussions collaborators ideas companies profiles spMessages"
        })
    };

    $http.get('api/notifications?filters=likes comments discussions collaborators ideas companies profiles spMessages', options).success(function(data) {
        console.log("DATA IS: ",data);
        $scope.stream = data;
    });

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'home';
        $rootScope.about = 'home';
    });

    $scope.isEmpty = function () {
        return (($scope.stream) && ($scope.stream.itemCount === 0));
    };
}

function SiteSearchController($rootScope, $scope, $location){
    $scope.searchSite = function(){
        //console.log('Search Site called');
        $location.path('/search/site/' + $scope.siteQuery);
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


