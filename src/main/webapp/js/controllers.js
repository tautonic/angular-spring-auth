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


