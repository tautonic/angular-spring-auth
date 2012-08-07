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
        $routeProvider.when( '/discussion/:discussionId', {
            templateUrl: 'lib/pykldiscuss/index.html',
            controller: DiscussionCtrl
        } );
        $routeProvider.when( '/both/:articleId/:discussionId', {
            templateUrl: 'partials/partial2.html'
        } );
        $routeProvider.when( '/both/:articleId', {
            templateUrl: 'partials/partial2.html'
        } );
		$routeProvider.otherwise( {redirectTo: '/view1'} );
	}


	// Declare app level module which depends on filters, and services
	angular.module( 'myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'pykl.security', 'ngSanitize'] )
			.config( ['$routeProvider', routeProvider] );
})();

