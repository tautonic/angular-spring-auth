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
        $routeProvider.when('/passwordtoken/:token', {
            templateUrl: 'lib/profile/profile.html'
        });
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
	var app = angular.module( 'myApp', ['bgc.directives', 'bgc.services', 'ngSanitize', 'ui', 'pykl'] )
			.config( ['$routeProvider', routeProvider] );

    app.value('ui.config', {
        tinymce: {
            theme: 'simple',
            width: '50%'
        },
        select2: {
            id: 'id',
            ajax: {
                url: "http://localhost:8080/gc/api/data/",
                dataType: 'json',
                data: function(term, page) {
                    var uri = encodeURI("input=" + term + "&types=establishment&sensor=true&key=AIzaSyAGbAUbk7G-U0LS7t3D5oQyME9REnTfFRI");
                    return {
                        q: uri,
                        page_limit: 10
                    };
                },
                results: function (data, page) { // parse the results into the format expected by Select2.
                    return {results: data.universities};
                }
            },
            formatResult: function(object, container, query){
                return object.terms[0].value;
            },
            formatSelection: function(object, container){
                return object.terms[0].value;
            }
        },
        jq: {
            // The qtip namespace
            qtip: {
                // qTip options. This object will be used as the defaults
                position: {
                    my: 'left center',
                    at:'right center'
                }
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

