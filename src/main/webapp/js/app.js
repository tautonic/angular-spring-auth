'use strict';


(function () {

	function routeProvider( $routeProvider ) {
		$routeProvider.when( '/view1', {
			templateUrl: 'partials/partial1.html',
			controller: MyCtrl1
		} );
		$routeProvider.when( '/view2', {
			templateUrl: 'partials/partial2.html',
			controller: MyCtrl2
		} );
		$routeProvider.otherwise( {redirectTo: '/view1'} );
	}


	var authenticationInterceptor = ['$rootScope', '$q', '$log', function ( $scope, $q, $log ) {
		function success( response ) {
			$log.info( 'Successful response: ' + JSON.stringify( response ) );
			return response;
		}

		function error( response ) {
			var status = response.status;

			$log.error( 'Error, status: ' + status + ', response: ' + JSON.stringify( response ) );
			if ( status === 401 ) {
				var deferred = $q.defer();
				var req = {
					config: response.config,
					deferred: deferred
				};
				$scope.requests401.push( req );
				$scope.$broadcast( 'event:loginRequired' );
				return deferred.promise;
			}

			return $q.reject( response );
		}

		return function ( promise ) {
			return promise.then( success, error );
		}
	}];

	function httpProvider( $httpProvider ) {
		$httpProvider.responseInterceptors.push( authenticationInterceptor );
	}

	function locationProvider( $locationProvider ) {
//		$locationProvider.html5Mode( true );
	}


	function run( $scope, $http, $log ) {
		// Holds any all requests that fail because of an authentication error.
		$scope.requests401 = [];

		$scope.$on( 'event:loginConfirmed', function () {

			function retry( req ) {
				$http( req.config ).then( function ( response ) {
					req.deferred.resolve( response );
				} );
			}

			var requests = $scope.requests401;
			for ( var i = 0, c = requests.length; i < c; i++ ) {
				retry( requests[i] );
			}
		} );

		$scope.$on( 'event:loginRequest', function ( event, username, password ) {
			var payload = $.param( {
				j_username: username,
				j_password: password
			} );
			var config = {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
				}
			};

			var success = function ( data ) {
				if ( data === 'AUTH_SUCCESS' ) {
					$scope.$broadcast( 'event:loginConfirmed' );
				} else {
					$scope.$broadcast( 'event:loginFailed' );
				}
			};

			$log.info( ' Submitting form to Spring', JSON.stringify( payload ), username, password );
			$http.post( 'j_spring_security_check', payload, config )
					.success( success );
		} );

		$scope.$on( 'event:logoutRequest', function () {
			function success() {
				$scope.$broadcast( 'event:logoutConfirmed' );
			}

			$http.put( 'j_spring_security_logout', {} )
					.success( success );
		} );
	}

	// Declare app level module which depends on filters, and services
	angular.module( 'myApp', ['myApp.filters', 'myApp.services', 'myApp.directives'] )
			.config( ['$routeProvider', routeProvider] )
			.config( ['$httpProvider', httpProvider] )
			.config( ['$locationProvider', locationProvider] )
			.run( ['$rootScope', '$http', '$log', run] );


})();

