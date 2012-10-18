'use strict';


(function () {

	function routeProvider( $routeProvider ) {
        $routeProvider.when( '/home', {
            templateUrl: 'partials/homepage.html',
            controller: 'HomepageController'
        } );

        //babson college pages
        $routeProvider.when( '/msce', {
			templateUrl: 'partials/msce.html'
		} );
        $routeProvider.when( '/faculty', {
			templateUrl: 'partials/faculty.html',
            controller: 'facultyFellows'
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
        $routeProvider.when( '/admin', {
            templateUrl: 'lib/pykladmin/index.html'
        });

        $routeProvider.when( '/login/:redirect', {
            templateUrl: 'lib/pyklsecurity/partials/signin-form.html',
            controller: 'LoginCtrl'
        });

        //individual controller pages, some of these might be removed
        $routeProvider.when( '/profiles', {
            templateUrl: 'lib/profile/partials/list.html',
            controller: 'listProfiles'
        } );
        $routeProvider.when( '/profiles/view/:profileId', {
            templateUrl: 'lib/profile/partials/view.html',
            controller: 'viewProfile'
        } );
        $routeProvider.when( '/profiles/update/:profileId', {
            templateUrl: 'lib/profile/partials/update.html',
            controller: 'updateProfile'
        } );
        $routeProvider.when( '/profiles/create', {
            templateUrl: 'lib/profile/partials/create.html',
            controller: 'createProfile'
        } );

        $routeProvider.when('/passwordtoken/:token', {
            templateUrl: 'lib/profile/profile.html'
        });
        $routeProvider.when( '/both/:articleId', {
            templateUrl: 'partials/partial2.html'
        } );
        $routeProvider.when( '/both/:articleId/:discussionId', {
            templateUrl: 'partials/partial2.html'
        } );

        $routeProvider.when( '/search/profiles/:query', {
            templateUrl: 'lib/search/partials/searchFacultyResults.html',
            controller: 'SearchProfiles'
        } );

        $routeProvider.when( '/search/site/:query', {
            templateUrl: 'lib/search/partials/searchSiteResults.html',
            controller: 'SearchSite'

        } );

        $routeProvider.when( '/search/content/:query', {
            templateUrl: 'lib/search/partials/searchContentResults.html',
            controller: 'SearchContent'
        } );

        $routeProvider.when( '/search/discussions/:query', {
            templateUrl: 'lib/search/partials/searchDiscussionsResults.html',
            controller: 'SearchDiscussions'
        } );

        $routeProvider.when( '/view', {
            templateUrl: 'partials/partial1.html'
        } );
		$routeProvider.otherwise( {redirectTo: '/view'} );
    }

    function locationProvider( $locationProvider ){
        $locationProvider.html5Mode(true);
    }

	// Declare app level module which depends on filters, and services
	var app = angular.module( 'myApp', ['bgc.directives', 'bgc.services', 'ngSanitize', 'ui', 'pykl'] )
			.config( ['$routeProvider', routeProvider] );

    app.value('ui.config', {
        tinymce: {
            theme: 'simple',
            width: '50%',
            preformatted: true
        },
        jq: {
            tooltip: {
                placement: 'right',
                trigger: 'manual'
            }
        }
    });

    app.value('pykl.config', {
        upload: {
            runtimes: 'html5',
            browse_button: 'choosefiles'
        }
    });

})();

