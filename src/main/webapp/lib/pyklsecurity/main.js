'use strict';

var pyklSecurity = angular.module( 'pykl.security', [] );


/**
 * Define the security service 'auth'.
 */
pyklSecurity.factory( 'Auth', ['$http', function ( $http ) {
	var authInfo = {};

	$http.get( 'api/auth' ).success( function ( data ) {
		authInfo = data;
	} );

	return authInfo;
}] );

pyklSecurity.directive( 'pyklLogin', [function () {
	return {
		restrict: 'ACME',
		template: ' \
<p ng-show="authenticated"> \
	Welcome {{username}} \
	<button ng-click="signout()">Sign out</button> \
</p> \
<p ng-hide="authenticated"> \
	<button ng-click="signin()">Sign in</button> \
</p> \
                 \
<form name="login" ng-show="form.visible" ng-submit="submit()"> \
	<p> \
		<label for="username">Username:</label> \
		<input id="username" type="text" ng-model="username" required/> \
	</p> \
	<p> \
		<label for="password">Password:</label> \
		<input id="password" type="password" ng-model="password" required/> \
	</p> \
	<p><input type="submit" value="Submit"/></p> \
</form> \
	'
	}
}] );

pyklSecurity.controller( 'LoginCtrl', ['$rootScope', '$scope', '$log',
	function ( $rootScope, $scope, $log ) {
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

		$scope.signin = function () {
			$scope.form.visible = true;
		};

		$scope.signout = function () {
			$rootScope.$broadcast( 'event:logoutRequest' );
		};

		$scope.submit = function () {
			$log.info( 'Submitting form', $scope.username, $scope.password );
			$log.info( 'Broadcasting event:loginRequest: ', $scope.username, $scope.password );
			$rootScope.$broadcast( 'event:loginRequest', $scope.username, $scope.password );
		}
	}]
);

pyklSecurity.config( ['$httpProvider',
	function ( $httpProvider, $rootScope, $q, $log ) {
		var authInterceptor = ['$rootScope', '$q', '$log',
			function ( $rootScope, $q, $log ) {
				function success( response ) {
					$log.info( 'Successful response: ' + JSON.stringify( response ) );
					return response;
				}

				function error( response ) {
					var status = response.status;

					$log.error( 'Error, status: ' + status + ', response: '
							+ JSON.stringify( response ) );
					if ( status === 401 ) {
						var deferred = $q.defer();
						var req = {
							config: response.config,
							deferred: deferred
						};
						$rootScope.requests401.push( req );
						$rootScope.$broadcast( 'event:loginRequired' );
						return deferred.promise;
					}

					return $q.reject( response );
				}

				return function ( promise ) {
					return promise.then( success, error );
				}
			}];

		$httpProvider.responseInterceptors.push( authInterceptor );
	}]
);

pyklSecurity.config( ['$locationProvider',
	function ( $locationProvider ) {
//		$locationProvider.html5Mode( true );
	}]
);

pyklSecurity.run( ['$rootScope', '$http', '$log',
	function run( $rootScope, $http, $log ) {
		// Holds any all requests that fail because of an authentication error.
		$rootScope.requests401 = [];

		$rootScope.$on( 'event:loginConfirmed', function () {

			function retry( req ) {
				$http( req.config ).then( function ( response ) {
					req.deferred.resolve( response );
				} );
			}

			var requests = $rootScope.requests401;
			for ( var i = 0, c = requests.length; i < c; i++ ) {
				retry( requests[i] );
			}
		} );

		$rootScope.$on( 'event:loginRequest', function ( event, username, password ) {
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
					$rootScope.$broadcast( 'event:loginConfirmed' );
				} else {
					$rootScope.$broadcast( 'event:loginFailed' );
				}
			};

			$log.info( ' Submitting form to Spring', JSON.stringify( payload ), username, password );
			$http.post( 'j_spring_security_check', payload, config )
					.success( success );
		} );

		$rootScope.$on( 'event:logoutRequest', function () {
			function success() {
				$rootScope.$broadcast( 'event:logoutConfirmed' );
			}

			$http.put( 'j_spring_security_logout', {} )
					.success( success );
		} );
	} ]
);



