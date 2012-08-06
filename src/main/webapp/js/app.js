'use strict';


(function () {

	function routeProvider( $routeProvider ) {
		$routeProvider.when( '/view1', {
			templateUrl: 'partials/partial1.html',
			controller: MyCtrl1
		} );
		$routeProvider.when( '/article/:articleId', {
            templateUrl: 'lib/pyklresource/index.html',
            controller: ResourceCtrl
        } );
		$routeProvider.otherwise( {redirectTo: '/view1'} );
	}


	// Declare app level module which depends on filters, and services
	angular.module( 'myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'pykl.security', 'ngSanitize'] )
			.config( ['$routeProvider', routeProvider] );
})();

