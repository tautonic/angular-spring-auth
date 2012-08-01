'use strict';

/* Controllers */


function MyCtrl1( $scope ) {
}
MyCtrl1.$inject = [];


function MyCtrl2( $rootScope, $scope, $http, $log ) {
	function ping() {
		$http.get( 'api/ping' ).success( function () {
			$log.info( 'Successfully retrieved protected resource.' );
//			$scope.$broadcast( 'event:loginConfirmed' );
		} );
	}

	$log.info( 'Initializing the MyCtrl2 controller.' );
	ping();
}
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


function LoginCtrl( $rootScope, $scope, $log ) {
	$log.info( 'Initializing the login controller' );
	$scope.username = 'fred';
	$scope.password = 'secret';
	$scope.authenticated = false;
	$scope.form = {
		visible: false
	};

	$rootScope.$on( 'event:loginConfirmed', function () {
		$log.info( 'event:loginConfirmed detected.' );
		$scope.form.visible = false;
		$scope.authenticated = true;
	} );

	$rootScope.$on( 'event:loginRequired', function () {
		$log.info( $scope.$id, 'event:loginRequired detected.' );
		$scope.form.visible = true;
	} );

	$rootScope.$on( 'event:logoutConfirmed', function () {
		$scope.form.visible = false;
		$scope.authenticated = false;
	} );

	$scope.signin = function() {
		$scope.form.visible = true;
	};

	$scope.signout = function() {
		$rootScope.$broadcast('event:logoutRequest');
	};

	$scope.submit = function () {
		$log.info( 'Submitting form', $scope.username, $scope.password );
		$log.info( 'Broadcasting event:loginRequest: ', $scope.username, $scope.password );
		$rootScope.$broadcast( 'event:loginRequest', $scope.username, $scope.password );
	}
}

LoginCtrl.$inject = ['$rootScope', '$scope', '$log'];
