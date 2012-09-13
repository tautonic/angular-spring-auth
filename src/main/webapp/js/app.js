'use strict';


(function () {

	function routeProvider( $routeProvider ) {
        $routeProvider.when( '/home', {
            templateUrl: 'partials/homepage.html'
        } );

        //babson college pages
        $routeProvider.when( '/msce', {
			templateUrl: 'partials/msce.html'
		} );
        $routeProvider.when( '/faculty', {
			templateUrl: 'partials/faculty.html'
		} );
        $routeProvider.when( '/content', {
			templateUrl: 'lib/pyklresource/index.html'
		} );
        $routeProvider.when( '/content/:articleId', {
            templateUrl: 'lib/pyklresource/index.html'
        } );
        $routeProvider.when( '/network/:discussionId', {
            templateUrl: 'lib/pykldiscuss/index.html'
        } );

        //individual controller pages, some of these might be removed
        $routeProvider.when( '/profile/:profileId', {
            templateUrl: 'lib/profile/profile.html'
        } );
        $routeProvider.when( '/both/:articleId', {
            templateUrl: 'partials/partial2.html'
        } );
        $routeProvider.when( '/both/:articleId/:discussionId', {
            templateUrl: 'partials/partial2.html'
        } );
        $routeProvider.when( '/view', {
            templateUrl: 'partials/partial1.html'
        } );
		$routeProvider.otherwise( {redirectTo: '/view'} );
	}


	// Declare app level module which depends on filters, and services
	var app = angular.module( 'myApp', ['pykl', 'bgc.directives', 'bgc.services', 'ngSanitize', 'ui'] )
			.config( ['$routeProvider', routeProvider] );

    app.value('ui.config', {
        tinymce: {
            theme: 'simple',
            width: '50%'
        }
    });
})();

