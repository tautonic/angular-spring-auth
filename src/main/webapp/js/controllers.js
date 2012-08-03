'use strict';

/* Controllers */


function MyCtrl1( $scope ) {
}
MyCtrl1.$inject = [];


function MyCtrl2( $rootScope, $scope, $http, $log ) {
	$scope.protected = 'Not loaded';

	function ping() {
		$http.get( 'api/ping' ).success( function (data) {
			$log.info( 'Successfully retrieved protected resource.' );
			$scope.protected = data;
		} );
	}

	ping();
}
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


