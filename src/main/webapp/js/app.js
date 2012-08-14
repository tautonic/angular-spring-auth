'use strict';


(function () {

	function routeProvider( $routeProvider ) {
		$routeProvider.when( '/view', {
			templateUrl: 'partials/partial1.html'
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
	var app = angular.module( 'myApp', ['pykl.security', 'ngSanitize', 'ui'] )
			.config( ['$routeProvider', routeProvider] );
})();

