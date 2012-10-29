var pykl = window.pykl || {};

(function(window, angular, undefined) {

	'use strict';

    var EVENT_INTERNAL_SIGNIN_CONFIRMED = 'event:int-signinConfirmed';
    var EVENT_INTERNAL_SIGNIN_FAILED = 'event:int-signinFailed';
    var EVENT_INTERNAL_SIGNOUT_CONFIRMED = 'event:int-signoutConfirmed';
    var EVENT_SIGNIN_REQUIRED = 'event:signinRequired';
    var EVENT_SIGNIN_REQUEST = 'event:signinRequest';
    var EVENT_SIGNIN_CONFIRMED = 'event:signinConfirmed';
    var EVENT_SIGNIN_FAILED = 'event:signinFailed';
    var EVENT_SIGNOUT_REQUEST = 'event:signoutRequest';
    var EVENT_SIGNOUT_CONFIRMED = 'event:signoutConfirmed';

	/**
	* @ngdoc object
	* @name pykl.$auth
	* @requires $http
	*
	* @description
	* A factory which creates an authentication object that lets you interact with a server-side
	* authentication mechanism.
	*
	* @returns {Object} An object that has properties and functions to provide insight into the
	* current user's authentication status and authorization roles.
	*
	* @example
	*
	* # Binding in Angular scope
	*
	* The
	* <pre>
	*    // Define CreditCard class
	*    var CreditCard = $resource('/user/:userId/card/:cardId',
	*     {userId:123, cardId:'@id'}, {
	*      charge: {method:'POST', params:{charge:true}}
	*     });
	*
	*    // We can retrieve a collection from the server
	*    var cards = CreditCard.query(function() {
	*      // GET: /user/123/card
	*      // server returns: [ {id:456, number:'1234', name:'Smith'} ];

	      var card = cards[0];
	      // each item is an instance of CreditCard
	      expect(card instanceof CreditCard).toEqual(true);
	      card.name = "J. Smith";
	      // non GET methods are mapped onto the instances
	      card.$save();
	      // POST: /user/123/card/456 {id:456, number:'1234', name:'J. Smith'}
	      // server returns: {id:456, number:'1234', name: 'J. Smith'};

	      // our custom method is mapped as well.
	      card.$charge({amount:9.99});
	      // POST: /user/123/card/456?amount=9.99&charge=true {id:456, number:'1234', name:'J. Smith'}
	    });

	    // we can create an instance as well
	    var newCard = new CreditCard({number:'0123'});
	    newCard.name = "Mike Smith";
	    newCard.$save();
	    // POST: /user/123/card {number:'0123', name:'Mike Smith'}
	    // server returns: {id:789, number:'01234', name: 'Mike Smith'};
	    expect(newCard.id).toEqual(789);
	* </pre>
	*
	* The object returned from this function execution is a resource "class" which has "static" method
	* for each action in the definition.
	*
	* Calling these methods invoke `$http` on the `url` template with the given `method` and `params`.
	* When the data is returned from the server then the object is an instance of the resource type and
	* all of the non-GET methods are available with `$` prefix. This allows you to easily support CRUD
	* operations (create, read, update, delete) on server-side data.

	  <pre>
	    var User = $resource('/user/:userId', {userId:'@id'});
	    var user = User.get({userId:123}, function() {
	      user.abc = true;
	      user.$save();
	    });
	  </pre>
	*
	*     It's worth noting that the success callback for `get`, `query` and other method gets passed
	*     in the response that came from the server as well as $http header getter function, so one
	*     could rewrite the above example and get access to http headers as:
	*
	  <pre>
	    var User = $resource('/user/:userId', {userId:'@id'});
	    User.get({userId:123}, function(u, getResponseHeaders){
	      u.abc = true;
	      u.$save(function(u, putResponseHeaders) {
	        //u => saved user object
	        //putResponseHeaders => $http header getter
	      });
	    });
	  </pre>

	* # Buzz client

	  Let's look at what a buzz client created with the `$resource` service looks like:
	   <doc:example>
	     <doc:source jsfiddle="false">
	      <script>
	        function BuzzController($resource) {
	          this.userId = 'googlebuzz';
	          this.Activity = $resource(
	            'https://www.googleapis.com/buzz/v1/activities/:userId/:visibility/:activityId/:comments',
	            {alt:'json', callback:'JSON_CALLBACK'},
	            {get:{method:'JSONP', params:{visibility:'@self'}}, replies: {method:'JSONP', params:{visibility:'@self', comments:'@comments'}}}
	          );
	        }

	        BuzzController.prototype = {
	          fetch: function() {
	            this.activities = this.Activity.get({userId:this.userId});
	          },
	          expandReplies: function(activity) {
	            activity.replies = this.Activity.replies({userId:this.userId, activityId:activity.id});
	          }
	        };
	        BuzzController.$inject = ['$resource'];
	      </script>

	      <div ng-controller="BuzzController">
	        <input ng-model="userId"/>
	        <button ng-click="fetch()">fetch</button>
	        <hr/>
	        <div ng-repeat="item in activities.data.items">
	          <h1 style="font-size: 15px;">
	            <img src="{{item.actor.thumbnailUrl}}" style="max-height:30px;max-width:30px;"/>
	            <a href="{{item.actor.profileUrl}}">{{item.actor.name}}</a>
	            <a href ng-click="expandReplies(item)" style="float: right;">Expand replies: {{item.links.replies[0].count}}</a>
	          </h1>
	          {{item.object.content | html}}
	          <div ng-repeat="reply in item.replies.data.items" style="margin-left: 20px;">
	            <img src="{{reply.actor.thumbnailUrl}}" style="max-height:30px;max-width:30px;"/>
	            <a href="{{reply.actor.profileUrl}}">{{reply.actor.name}}</a>: {{reply.content | html}}
	          </div>
	        </div>
	      </div>
	     </doc:source>
	     <doc:scenario>
	     </doc:scenario>
	   </doc:example>
	*/
    var pyklSecurity = angular.module( 'pykl', [] )
			.factory( '$auth', ['$rootScope', '$http', '$log', function ( $rootScope, $http, $log ) {
		var roles = [];

		function initAuth() {
			roles = [];
			$rootScope.auth = {
				isAuthenticated: false,
                requestLogin: function() {
                    $rootScope.$broadcast('event:loginRequired');
                }
			};
		}
		initAuth();
		function getAuth() {
			return $http.get( 'api/auth' )
					.success( function ( data, status, headers, config ) {
						$rootScope.auth.principal = data.principal;
						$rootScope.auth.isAuthenticated =
								(data && (data.username != null) && (data.username != 'anonymousUser'));
						roles = data.roles;
						$log.info('Received successful auth response:', data);
					} )
					.error( function ( data, status, headers, config ) {
						initAuth();
						$log.warn( 'Failed to retrieve auth object:', status, data );
					} );
		}

		var isUserInRole = $rootScope.auth.isUserInRole = function ( role ) {
			var checkRole = role.toLowerCase();
			for ( var i = 0, c = roles.length; i < c; i++ ) {
				if ( roles[i].localeCompare( checkRole ) === 0 ) return true;
			}
			return false;
		};

		$rootScope.$on( EVENT_INTERNAL_SIGNIN_CONFIRMED, function() {
            getAuth().then(function() {
                $rootScope.$broadcast(EVENT_SIGNIN_CONFIRMED, result);
            });
        });
		$rootScope.$on( EVENT_INTERNAL_SIGNOUT_CONFIRMED, function() {
            getAuth().then(function() {
                $rootScope.$broadcast(EVENT_SIGNOUT_CONFIRMED, result);
            });
        });

		getAuth();

		// Return the service onject for direct invocations
		var result = {
			isUserInRole: isUserInRole,
            event: {
                signinRequired: EVENT_SIGNIN_REQUIRED,
                signinRequest: EVENT_SIGNIN_REQUEST,
                signinConfirmed: EVENT_SIGNIN_CONFIRMED,
                signinFailed: EVENT_SIGNIN_FAILED,
                signoutRequest: EVENT_SIGNOUT_REQUEST,
                signoutConfirmed: EVENT_SIGNOUT_CONFIRMED
            }
		};
		Object.defineProperty(result, 'isAuthenticated', {
			get: function() {
				return $rootScope.auth.isAuthenticated;
			}
		});
		Object.defineProperty(result, 'principal', {
			get: function() {
				return $rootScope.auth.username;
			}
		});
		return result;
	}] );

	/**
	 * @ngdoc function
	 * @name pykl.$security.directive
	 * @methodOf ng.$security
	 * @function
	 *
	 * @description
	 * Creates a stock login form.
	 *
	 * @param {string} name Name of the directive in camel-case. (ie <code>ngBind</code> which will match as
	 *                <code>ng-bind</code>).
	 * @param {function} directiveFactory An injectable directive factroy function. See {@link guide/directive} for more
	 *                info.
	 */
    pyklSecurity.directive( 'pyklLogin', ['$auth', function (auth) {
		return {
			restrict: 'ACME',
			template: '<li>\
        <span ng-show="!auth.isAuthenticated"><a ng-click="callLoginPage()"><span x-cms="menu_signin">{{cms.content}}</span></a></span> \
        <div ng-show="auth.isAuthenticated" class="dropdown" ng-dropdown> \
            <a data-toggle="dropdown" class="thumb"> \
                <div class="new-picture-frame profile-thumbnail medium clockwise">\
                    <img ng-src ="{{auth.principal.thumbnail}}" alt="">\
                </div>\
            </a> \
        <ul class="dropdown-menu"> \
            <li><span class="gradient"><a ng-href="#/profiles/view/{{auth.principal.id}}">My profile</a></span></li> \
            <li><span class="gradient"><a ng-href="#/profiles/update/{{auth.principal.id}}">Change Picture</a></span></li> \
        <li ng-show="auth.isUserInRole(\'ROLE_ADMIN\')"><span class="gradient"><a ng-href="#/admin/">Admin Panel</a></span></li> \
            <li><span class="gradient"><a ng-click="signout()">Logout</a></span></li> \
        </ul> \
        </div> \
        </li>',
            replace: true
		}
	}] );

    pyklSecurity.controller( 'LoginWatch', ['$rootScope', '$scope', '$location', '$log',
		function ( $rootScope, $scope, $location, $log ) {
            var referral;

            function gotoLoginPage() {
                referral = $location.path();
                $location.path('login');
            }

            $scope.callLoginPage = gotoLoginPage;

			$rootScope.$on( EVENT_SIGNIN_CONFIRMED, function () {
				$log.info( EVENT_SIGNIN_CONFIRMED + ' detected.' );
                $location.path(referral);
			} );

			$rootScope.$on( EVENT_SIGNIN_REQUIRED, function () {
				$log.info( $scope.$id, EVENT_SIGNIN_REQUIRED, 'detected.' );
                gotoLoginPage();
			} );

			$rootScope.$on( EVENT_INTERNAL_SIGNOUT_CONFIRMED, function () {

			});

			$scope.signout = function () {
				$rootScope.$broadcast( EVENT_SIGNOUT_REQUEST );
			};
		}]
	);

    pyklSecurity.config( ['$httpProvider',
		function ( $httpProvider, $rootScope, $q, $log ) {
			var authInterceptor = ['$rootScope', '$q', '$log',
				function ( $rootScope, $q, $log ) {
					function success( response ) {
						//$log.info( 'Successful response: ' + JSON.stringify( response ) );
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
							$rootScope.$broadcast( EVENT_SIGNIN_REQUIRED );
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

			$rootScope.$on( EVENT_SIGNIN_CONFIRMED, function () {

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

			$rootScope.$on( EVENT_SIGNIN_REQUEST, function ( event, username, password ) {
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
						$rootScope.$broadcast( EVENT_INTERNAL_SIGNIN_CONFIRMED );
					} else {
                        // todo: Implement something
						$rootScope.$broadcast( EVENT_INTERNAL_SIGNIN_FAILED );
					}
				};

				$log.info( ' Submitting form to Spring', JSON.stringify( payload ), username, password );
				$http.post( 'j_spring_security_check', payload, config )
						.success( success );
			} );

			$rootScope.$on( EVENT_SIGNOUT_REQUEST, function () {
				function success() {
					$rootScope.$broadcast( EVENT_SIGNOUT_CONFIRMED );
				}

				$http.put( 'j_spring_security_logout', {} )
						.success( success );
			} );
		} ]
	);


})(window, window.angular);

function LoginCtrl( $rootScope, $scope, $log ) {
    $scope.username = 'fred';
    $scope.password = 'secret';

    $scope.submit = function () {
        $log.info( 'Submitting form', $scope.username, $scope.password );
        $log.info( 'Broadcasting ', EVENT_SIGNIN_REQUEST , $scope.username, $scope.password );
        $rootScope.$broadcast( EVENT_SIGNIN_REQUEST, $scope.username, $scope.password );
    };

    /*$scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'none';
    });*/

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'signin';
    });
}

LoginCtrl.$inject = ['$rootScope', '$scope', '$log'];
//window.LoginCtrl = LoginCtrl;

