var pykl = window.pykl || {};

(function (window, angular, undefined) {

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

    var pyklSecurity = angular.module('pykl.security', []);

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
     */
    pyklSecurity.factory('$auth', ['$rootScope', '$http', '$log', function ($rootScope, $http, $log) {
        var roles = [];

        function initAuth() {
            roles = [];
            $rootScope.auth = {
                isAuthenticated:false,
                requestLogin:function () {
                    $rootScope.$broadcast(EVENT_SIGNIN_REQUIRED);
                },
                id:0
            };
        }

        initAuth();
        function getAuth() {
            return $http.get('api/auth')
                .success(function (data, status, headers, config) {
                    $rootScope.auth.principal = data.principal;
                    $rootScope.auth.isAuthenticated =
                        (data && (data.username != null) && (data.username != 'anonymousUser'));
                    roles = data.roles;
                    $rootScope.auth.id = data.principal.id;
                    $rootScope.auth.username = data.principal.username;
                    $log.info('Received successful auth response:', data);
                })
                .error(function (data, status, headers, config) {
                    initAuth();
                    $log.warn('Failed to retrieve auth object:', status, data);
                });
        }

        var isUserInRole = $rootScope.auth.isUserInRole = function (role) {
            var checkRole = role.toLowerCase();
            for (var i = 0, c = roles.length; i < c; i++) {
                if (roles[i].localeCompare(checkRole) === 0) return true;
            }
            return false;
        };

        $rootScope.auth.isUser = function(id) {
            return ($rootScope.auth.id === id);
        };

        $rootScope.$on(EVENT_INTERNAL_SIGNIN_CONFIRMED, function () {
            getAuth().then(function () {
                $rootScope.$broadcast(EVENT_SIGNIN_CONFIRMED, result);
            });
        });
        $rootScope.$on(EVENT_INTERNAL_SIGNOUT_CONFIRMED, function () {
            getAuth().then(function () {
                $rootScope.$broadcast(EVENT_SIGNOUT_CONFIRMED, result);
            });
        });

        getAuth();

        // Return the service onject for direct invocations
        var result = {
            isUserInRole: isUserInRole,
            event:{
                signinRequired:EVENT_SIGNIN_REQUIRED,
                signinRequest:EVENT_SIGNIN_REQUEST,
                signinConfirmed:EVENT_SIGNIN_CONFIRMED,
                signinFailed:EVENT_SIGNIN_FAILED,
                signoutRequest:EVENT_SIGNOUT_REQUEST,
                signoutConfirmed:EVENT_SIGNOUT_CONFIRMED
            }
        };

        //IE8 doesn't support Object.defineProperty()
        try {
            Object.defineProperty(result, 'isAuthenticated', {
                get:function () {
                    return $rootScope.auth.isAuthenticated;
                }
            });
            Object.defineProperty(result, 'principal', {
                get:function () {
                    return $rootScope.auth.username;
                }
            });
            Object.defineProperty(result, 'id', {
                get:function () {
                    return $rootScope.auth.id;
                }
            });
        } catch(e) {
            result.isAuthenticated = function () {
                return $rootScope.auth.isAuthenticated;
            };
            result.principal = function () {
                return $rootScope.auth.username;
            };
            result.id = function () {
                return $rootScope.auth.id;
            };
        }

        return result;
    }]);

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
    pyklSecurity.directive('pyklLogin', function () {
        return {
            restrict:'ACME',
            template:'<li>\
        <span ng-show="!auth.isAuthenticated"><a ng-click="callLoginPage()"><span x-cms="menu_signin">{{cms.content}}</span></a></span> \
        <div ng-show="auth.isAuthenticated" class="dropdown" ng-dropdown> \
            <a data-toggle="dropdown" class="thumb"> \
                <div class="new-picture-frame profile-thumbnail medium clockwise">\
                    <img ng-src ="{{auth.principal.thumbnail}}" alt="">\
                </div>\
            </a> \
        <ul class="dropdown-menu"> \
            <li><span class="gradient"><a ng-href="#/profiles/view/{{auth.principal.id}}">My profile</a></span></li> \
        <li ui-if="auth.isUserInRole(\'ROLE_ADMIN\')"><span class="gradient"><a ng-href="#/admin/users">Admin Panel</a></span></li> \
            <li><span class="gradient"><a ng-click="signout()">Log Out</a></span></li> \
        </ul> \
        </div> \
        </li>',
            replace:true
        }
    });

    pyklSecurity.controller('LoginWatch', ['$rootScope', '$scope', '$location', '$log',
        function ($rootScope, $scope, $location, $log) {
            var referral;

            function gotoLoginPage() {
                referral = $location.path();
                $location.path('login');
            }

            $scope.callLoginPage = gotoLoginPage;

            $rootScope.$on(EVENT_SIGNIN_CONFIRMED, function () {
                $log.info(EVENT_SIGNIN_CONFIRMED + ' detected.');
                $location.path(referral);
            });

            $rootScope.$on(EVENT_SIGNIN_REQUIRED, function () {
                $log.info($scope.$id, EVENT_SIGNIN_REQUIRED, 'detected.');
                gotoLoginPage();
            });

            $rootScope.$on(EVENT_INTERNAL_SIGNOUT_CONFIRMED, function () {

            });

            $scope.signout = function () {
                $rootScope.$broadcast(EVENT_SIGNOUT_REQUEST);
                $location.path('/home');
            };
        }]
    );

    pyklSecurity.config(['$httpProvider',
        function ($httpProvider, $rootScope, $q, $location, $log) {
            var authInterceptor = ['$rootScope', '$q', '$location', '$log',
                function ($rootScope, $q, $location, $log) {
                    function success(response) {
                        //$log.info( 'Successful response: ' + JSON.stringify( response ) );
                        return response;
                    }

                    function error(response) {
                        var status = response.status;

                        $log.error( 'Error, status: ' + status + ', response: ' + JSON.stringify( response ) );

                        if (status === 401) {
                            //there seems to be a bug relating to the defer() function in IE8. This does not appear to affect anything major, though, so will not be fixed at this time
                            var deferred = $q.defer();
                            var req = {
                                config:response.config,
                                deferred:deferred
                            };
                            $rootScope.requests401.push(req);
                            $rootScope.$broadcast(EVENT_SIGNIN_REQUIRED);

                            return deferred.promise;
                        }
                        if (status === 404
                            && $location.path().indexOf('/profiles/view') === -1
                            && $location.path() !== '/signup'
                            && $location.path() !== '/admin/users/new')
                        {
                            $location.path("error/404");
                        }
                        if (status === 500) {
                            $location.path("error/500");
                        }

                        return $q.reject(response);
                    }

                    return function (promise) {
                        return promise.then(success, error);
                    }
                }];

            $httpProvider.responseInterceptors.push(authInterceptor);
        }]
    );

    pyklSecurity.config(['$locationProvider',
        function ($locationProvider) {
            //		$locationProvider.html5Mode( true );
        }]
    );

    pyklSecurity.run(['$rootScope', '$http', '$location', '$log',
        function run($rootScope, $http, $location, $log) {
            // Holds any all requests that fail because of an authentication error.
            $rootScope.requests401 = [];

            $rootScope.$on(EVENT_SIGNIN_CONFIRMED, function () {

                function retry(req) {
                    $http(req.config).then(function (response) {
                        req.deferred.resolve(response);
                    });
                }

                var requests = $rootScope.requests401;
                for (var i = 0, c = requests.length; i < c; i++) {
                    retry(requests[i]);
                }
            });

            $rootScope.$on(EVENT_SIGNIN_REQUEST, function (event, username, password) {
                var payload = $.param({
                    j_username:username,
                    j_password:password
                });
                var config = {
                    headers:{
                        'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                    }
                };

                var success = function (data) {
                    if (data === 'AUTH_SUCCESS') {
                        $rootScope.$broadcast(EVENT_INTERNAL_SIGNIN_CONFIRMED);
                    } else {
                        $rootScope.$broadcast(EVENT_INTERNAL_SIGNIN_FAILED, data);
                    }
                };

                $log.info(' Submitting form to Spring', JSON.stringify(payload), username, password);
                $http.post('j_spring_security_check', payload, config)
                    .success(success);
            });

            $rootScope.$on(EVENT_SIGNOUT_REQUEST, function () {
                function success() {
                    $rootScope.$broadcast(EVENT_INTERNAL_SIGNOUT_CONFIRMED);
                }

                $http.put('j_spring_security_logout', {})
                    .success(success);
            });

            //todo: sign in only provides an error on failure, it does not provide a reason for the failure
            $rootScope.$on(EVENT_INTERNAL_SIGNIN_FAILED, function(event, reason) {
                $log.info("ERROR logging in: Log In attempt returned: "+reason);
                if(reason === "AUTH_INACTIVE") {
                    $location.path('activateAccount');
                } else if(reason === "AUTH_BAD_CREDENTIALS") {
                    $rootScope.showSignInError = true;
                    $rootScope.signInErrorReason = "Username or password incorrect";
                } else {

                    $rootScope.showSignInError = true;
                    $rootScope.signInErrorReason = "Your account could not be logged in";
                }

            })
        } ]
    );

    function LoginCtrl($rootScope, $scope, $auth, $log) {
        $scope.username = 'fred';
        $scope.password = 'secret';

        $scope.submit = function () {
            $log.info('Submitting form', $scope.username, $scope.password);
            $log.info('Broadcasting ', $auth.event.signinRequest, $scope.username, $scope.password);
            $rootScope.$broadcast($auth.event.signinRequest, $scope.username, $scope.password);
        };

        $scope.$on('$routeChangeSuccess', function () {
            $rootScope.banner = 'none';
            $rootScope.about = 'signin';
        });
    }

    LoginCtrl.$inject = ['$rootScope', '$scope', '$auth', '$log'];
    window.pykl.LoginCtrl = LoginCtrl;

})(window, window.angular);

