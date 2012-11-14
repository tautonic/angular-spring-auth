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

        //services and programs section. mostly articles
        $routeProvider.when( '/content/', {
			templateUrl: 'lib/pyklresource/index.html',
            controller: 'ListResources'
		} );

        $routeProvider.when( '/content/:sortBy', {
            templateUrl: 'lib/pyklresource/index.html',
            controller: 'ListResources'
        } );

        //no controller here because individual content/articles can have discussions attached to them, and this makes that happen
        $routeProvider.when( '/content/view/:articleId', {
            templateUrl: 'lib/pyklresource/partials/view.html'
        } );

        $routeProvider.when( '/content/service/:service', {
            templateUrl: 'lib/pyklresource/index.html',
            controller: 'servicesProgramsController'
        } );

        //by default, the network page lists discussions. This is for that

        $routeProvider.when( '/network/discussion/list', {
            templateUrl: 'lib/pykldiscuss/index.html'
        } );

        $routeProvider.when( '/network/discussion/view/:discussionId', {
            templateUrl: 'lib/pykldiscuss/partials/view.html',
            controller: 'ViewDiscussion'
        } );

        $routeProvider.when( '/network/discussion/new', {
            templateUrl: 'lib/pykldiscuss/partials/new.html',
            controller: 'NewDiscussion'
        } );

        //admin section
        $routeProvider.when( '/admin/users', {
            templateUrl: 'lib/pykladmin/partials/users.html',
            controller: 'adminUsersList'
        });

        $routeProvider.when( '/admin/users/new', {
            templateUrl: 'lib/pykladmin/partials/newuser.html',
            controller: 'adminUsersNew'
        });

        $routeProvider.when( '/admin/articles', {
            templateUrl: 'lib/pykladmin/partials/articles.html',
            controller: 'ListResources'
        });

        $routeProvider.when( '/admin/articles/create', {
            templateUrl: 'lib/pykladmin/partials/articlescreate.html',
            controller: 'adminArticlesCreate'
        });

        $routeProvider.when( '/admin/articles/update/:articleId', {
            templateUrl: 'lib/pykladmin/partials/articlesupdate.html',
            controller: 'adminArticlesUpdate'
        });

        //profile section
        $routeProvider.when( '/network/members', {
            templateUrl: 'lib/profile/partials/list.html',
            controller: 'listProfiles'
        } );

        $routeProvider.when( '/profiles/view/:profileId', {
            templateUrl: 'lib/profile/partials/landingPage.html',
            controller: 'viewProfile'
        } );

        $routeProvider.when( '/profiles/view/:profileId/activities', {
            templateUrl: 'lib/profile/partials/activities.html',
            controller: 'viewActivities'
        } );

        $routeProvider.when( '/profiles/view/:profileId/following', {
            templateUrl: 'lib/profile/partials/following.html',
            controller: 'viewFollowing'
        } );

        $routeProvider.when( '/profiles/update/:profileId', {
            templateUrl: 'lib/profile/partials/update.html',
            controller: 'updateProfile'
        } );

        //search site and other sections
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

        //error pages
        $routeProvider.when( '/error/404', {
            templateUrl: 'partials/404.html',
            controller: 'errorController'
        } );

        $routeProvider.when( '/error/500', {
            templateUrl: 'partials/500.html',
            controller: 'error500Controller'
        } );

        //stuff related to login and account management
        $routeProvider.when( '/login', {
            templateUrl: 'lib/pyklsecurity/partials/signin-form.html',
            controller: pykl.LoginCtrl
        });

        $routeProvider.when( '/signup/:email', {
            templateUrl: 'lib/profile/partials/create.html',
            controller: 'createProfile'
        } );
        $routeProvider.when( '/signup', {
            templateUrl: 'lib/profile/partials/create.html',
            controller: 'createProfile'
        } );

        $routeProvider.when( '/verifyemail/:token', {
            templateUrl: 'partials/emailverified.html',
            controller: 'verifyEmailController'
        } );

        $routeProvider.when( '/forgotusername', {
            templateUrl: 'partials/forgotusername.html',
            controller: 'forgotUsernameController'
        } );

        $routeProvider.when( '/usernamesendsuccess', {
            templateUrl: 'partials/usernamesendsuccess.html',
            controller: 'forgotUsernameController'
        } );


        $routeProvider.when( '/forgotpassword', {
            templateUrl: 'partials/forgotpassword.html',
            controller: 'forgotPasswordController'
        } );
        $routeProvider.when( '/passswordsendsuccess', {
            templateUrl: 'partials/passwordsendsuccess.html',
            controller: 'forgotPasswordController'
        } );
        $routeProvider.when('/passwordtoken/:token', {
            templateUrl: 'partials/passwordtoken.html',
            controller: 'resetPasswordController'
        });

        $routeProvider.when('/activateAccount', {
            templateUrl: 'partials/activateAccount.html',
            controller: 'activateAccountController'
        });

		$routeProvider.otherwise( {redirectTo: '/error/404'} );
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

