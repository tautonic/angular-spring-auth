'use strict';

/* Controllers */


function MyCtrl1($rootScope, $scope, $http ) {
	console.log("IN HOMEPAGE");

    var options = {
        data: JSON.stringify({
            filters: "likes comments discussions collaborators ideas companies profiles spMessages"
        })
    };

    $http.get('api/notifications?filters=', options).success(function(data) {
        console.log("DATA IS: ",data);
        $scope.stream = data;
    });

    $scope.isEmpty = function() {
        return (($scope.stream) && ($scope.stream.itemCount === 0));
    }
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
MyCtrl1.$inject = ['$rootScope', '$scope', '$http'];
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


