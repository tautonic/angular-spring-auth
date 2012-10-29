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
        $routeProvider.when( '/content/', {
			templateUrl: 'lib/pyklresource/partials/list.html',
            controller: 'ListResources'
		} );
        //using the index here because individual content/articles can have discussions attached to them, and this makes that happen
        //so there can't really be a single controller set here
        $routeProvider.when( '/content/:articleId', {
            templateUrl: 'lib/pyklresource/index.html'
        } );

        //by default, the network page lists discussions. This is for that
        $routeProvider.when( '/network/', {
            templateUrl: 'lib/pykldiscuss/partials/list.html',
            controller: 'ListDiscussions'
        } );

        $routeProvider.when( '/network/discussion', {
            templateUrl: 'lib/pykldiscuss/partials/list.html',
            controller: 'ListDiscussions'
        } );

        $routeProvider.when( '/network/discussion/view/:discussionId', {
            templateUrl: 'lib/pykldiscuss/partials/view.html',
            controller: 'ViewDiscussion'
        } );

        $routeProvider.when( '/network/discussion/new', {
            templateUrl: 'lib/pykldiscuss/partials/new.html',
            controller: 'NewDiscussion'
        } );

        $routeProvider.when( '/admin', {
            templateUrl: 'lib/pykladmin/index.html'
        });

        $routeProvider.when( '/login', {
            templateUrl: 'lib/pyklsecurity/partials/signin-form.html',
            controller: 'LoginCtrl'
        });

        //individual controller pages, some of these might be removed
        $routeProvider.when( '/profiles/view/:profileId', {
            templateUrl: 'lib/profile/partials/view.html',
            controller: 'viewProfile'
        } );
        $routeProvider.when( '/profiles/update/:profileId', {
            templateUrl: 'lib/profile/partials/update.html',
            controller: 'updateProfile'
        } );
        /*$routeProvider.when( '/profiles/create', {
            templateUrl: 'lib/profile/partials/create.html',
            controller: 'createProfile'
        } );*/
        $routeProvider.when( '/signup', {
            templateUrl: 'lib/profile/partials/create.html',
            controller: 'createProfile'
        } );

        $routeProvider.when('/passwordtoken/:token', {
            templateUrl: 'lib/profile/profile.html'
        });

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

        $routeProvider.when( '/error/404', {
            templateUrl: 'partials/404.html',
            controller: 'errorController'
        } );

        $routeProvider.when( '/view', {
            templateUrl: 'partials/partial1.html'
        } );
		$routeProvider.otherwise( {redirectTo: '/home'} );
    }

    function locationProvider( $locationProvider ){
        $locationProvider.html5Mode(true);
    }

	// Declare app level module which depends on filters, and services
	var app = angular.module( 'myApp',
	    ['bgc.directives', 'bgc.services', 'bgc.filters', 'ngSanitize', 'ui', 'pykl', 'pykl.cms'] )
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

