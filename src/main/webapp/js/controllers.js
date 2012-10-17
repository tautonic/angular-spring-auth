'use strict';

/* Controllers */


function MyCtrl1($rootScope, $scope, $http, $location, $route) {
	console.log("IN HOMEPAGE");

    $rootScope.query = '';
    $rootScope.faculty_query = '';
    $rootScope.content_query = '';
    $rootScope.discussion_query = '';

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

    $rootScope.search_faculty = function(){
        $location.path('/search/profiles/' + $rootScope.faculty_query);
    };

    $rootScope.search_site = function(){
        $location.path('/search/site/' + $rootScope.query);
    };

    $rootScope.search_content = function(){
        $location.path('/search/content/' + $rootScope.content_query);
    };

    $rootScope.search_discussions = function(){
        $location.path('/search/discussions/' + $rootScope.discussion_query);
    };
}

function facultyFellows($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'faculty';
        $rootScope.about = 'none';
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
MyCtrl1.$inject = ['$rootScope', '$scope', '$http', '$location'];
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


