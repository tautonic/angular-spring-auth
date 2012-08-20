'use strict';


(function () {

	function routeProvider( $routeProvider ) {
        $routeProvider.when( '/home', {
            templateUrl: 'partials/homepage.html'
        } );
		$routeProvider.when( '/view', {
			templateUrl: 'partials/partial1.html'
		} );
        $routeProvider.when( '/profile', {
            templateUrl: 'lib/profile/profile.html'
        } );
		$routeProvider.when( '/article/:articleId', {
            templateUrl: 'lib/pyklresource/index.html'
        } );
        $routeProvider.when( '/discussion/:discussionId', {
            templateUrl: 'lib/pykldiscuss/index.html'
        } );
        $routeProvider.when( '/both/:articleId/:discussionId', {
            templateUrl: 'partials/partial2.html'
        } );
        $routeProvider.when( '/both/:articleId', {
            templateUrl: 'partials/partial2.html'
        } );
		$routeProvider.otherwise( {redirectTo: '/view'} );
	}


	// Declare app level module which depends on filters, and services
	var app = angular.module( 'myApp', ['pykl', 'bgc-profile.directives', 'ngSanitize', 'ui'] )
			.config( ['$routeProvider', routeProvider] );
})();

