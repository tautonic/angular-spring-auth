'use strict';

/* Controllers */


var MyCtrl1 = ['$scope', '$auth', function($scope, auth ) {
	console.log( 'pyklAuth', auth );
	console.log( '$scope.isAuthenticated', auth.isAuthenticated );

	$scope.reloadAuth = function() {
		$scope.scopeIsAuthenticated = auth.isAuthenticated;
		$scope.scopePrincipal = auth.principal;
		$scope.scopeIsAdmin = auth.isUserInRole('role_admin');
		$scope.scopeIsUser = auth.isUserInRole('role_user');
	};

	$scope.reloadAuth();
}];


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
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


