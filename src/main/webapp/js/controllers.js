'use strict';

/* Controllers */


function HomepageController($rootScope, $scope, $http, $location, $route) {
    $rootScope.siteQuery = '';
    $rootScope.faculty_query = '';
    $rootScope.content_query = '';
    $rootScope.discussion_query = '';

    var attachmentIndex = 0;
    var attachments;

    $scope.$on('showAttachmentModal', function(args){
        attachments = args.targetScope.thumb.attachments;

        loadAttachment();
        $scope.showModal = true;
    });

    $scope.next = function() {
        changeAttachmentIndex("inc");
    };

    $scope.previous = function() {
        changeAttachmentIndex("dec");
    };

    function loadAttachment() {
        var id = attachments[attachmentIndex];
        $http.get( 'api/article/' + id ).success( function (data) {
            var uri = data.uri.replace('http://', '');
            var filesize = data.filesize === undefined ? 'Filesize unavailable' : data.filesize;
            $scope.modal = {
                document: {
                    title: data.title,
                    filename: data.name,
                    description: data.description,
                    url: 'http://docs.google.com/viewer?url=http://' + uri + '&embedded=true',
                    directLink: "http://" + uri,
                    doctype: data.doctype,
                    author: data.author,
                    dateCreated: data.dateCreated,
                    filesize: filesize
                }
            };
            $http.post("api/utility/view/" + id);
        }).error(function(data, status) {

            });
    }

    //we do this in a function so we can handle cases where it goes too far in one direction or another
    function changeAttachmentIndex(direction) {
        attachmentIndex += (direction === "inc") ? 1 : -1;

        if(attachmentIndex >= attachments.length) {
            attachmentIndex = 0;
        } else if(attachmentIndex < 0) {
            attachmentIndex = attachments.length - 1;
        }

        loadAttachment();
    }

    $scope.hasMoreThanAttachments = function(total) {
        return (attachments && attachments.length > total);
    };

    $scope.toggleModal = function(show){
        $scope.showModal = show;
    };

    $http.get("api/utility/getquote").success(function(data) {
        $scope.quote = data.quote;
    });

    $http.get('api/article/all/news').success(function(data) {
        if(typeof(data) === "object") {
            $scope.articles = data;
            // loop through the array of articles
            $scope.articles.forEach(function(article){
                // add an attribute to the article that will
                // contain the array of doctypes attached to the article
                article.childDoctypes = [];
                // loop through each article's attachments
                article.attachments.forEach(function(attachment){
                    $http.get('api/article/' + attachment)
                        .success(function(data, status){
                            // add the attachment doctype to the array
                            article.childDoctypes.push(data.doctype);
                        });
                });
            });
        } else {
            $location.path('/maintenance');
        }
    });

    var options = {
        data: JSON.stringify({
            filters: "likes comments discussions collaborators ideas companies profiles spMessages"
        })
    };

    $http.get('api/notifications?filters=likes comments discussions collaborators ideas companies profiles spMessages', options).success(function(data) {
        $scope.stream = data;
    });

    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'home';
        $rootScope.about = 'home';
    });

    $scope.isEmpty = function () {
        return (($scope.stream) && ($scope.stream.itemCount === 0));
    };

    $scope.signup = function(email) {
        $location.path("/signup/"+email);
    }
}

function SiteSearchController($rootScope, $scope, $location){
    $scope.searchSite = function(){
        $location.path('/search/site/' + $scope.siteQuery);
        openSearch();
        $scope.siteQuery = '';
    };
}

function searchDiscussionsController($scope, $location){
    $scope.searchDiscussions = function(){
        $location.path('/search/discussions/' + $scope.query);
    }
}

function errorController($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = '404';
    });
}

function error500Controller($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = '500';
    });
}

function maintenanceController($rootScope, $scope){
    $scope.$on('$routeChangeSuccess', function(){
        $rootScope.banner = 'none';
        $rootScope.about = 'maintenance';
    });
}

function verifyEmailController($rootScope, $scope, $routeParams, $http, $log){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $http.get('api/utility/verifyemail/' + $routeParams.token)
        .success(function(data, status, headers, config){
            $scope.success = data.content.verified;
        })
        .error(function(data, status, headers, config){
            $log.info('TOKEN VERIFICATION ERROR!!!');
        });
}

function forgotUsernameController($rootScope, $scope, $location, $http, $log){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $scope.send = function(){
        $http.post('api/utility/sendusername/' + $scope.email)
            .success(function(data, status, headers, config){
                $location.path('/usernamesendsuccess');
            })
            .error(function(data, status, headers, config){
                $log.info('SEND USERNAME ERROR!');
            });
    }
}

/**
 * Allows the user to input their email address and get an email which will (eventually) reset their passwords
 * @param $rootScope
 * @param $scope
 * @param $location
 * @param $http
 */
function forgotPasswordController($rootScope, $scope, $location, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';

    $scope.send = function(){
        var data = {
            profileEmail: $scope.email
        };

        $http.post('api/utility/resettoken/', data)
            .success(function(data, status, headers, config){
                if(data.success) {
                    $location.path('/passswordsendsuccess');
                } else {
                    $scope.showError = true;
                }
            });
    }
}

/**
 * After receiving an email to reset their passwords, users go to the link here and this will actually reset their passwords, provided the token is still valid
 * @param $rootScope
 * @param $scope
 * @param $location
 * @param $http
 */
function resetPasswordController($rootScope, $scope, $routeParams, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';
    $scope.resetStatus = "waiting";

    var data = {
        token: $routeParams.token
    };

    $http.post('api/utility/resetpassword/', data)
        .success(function(data, status, headers, config){
            if(data.success) {
                $scope.resetStatus = "success";
            } else {
                $scope.resetStatus = "error";
            }
        });
}

/**
 * Show the form for activating account, or resending the verification email.
 * @param $rootScope
 * @param $scope
 * @param $location
 * @param $http
 */
function activateAccountController($rootScope, $scope, $location, $http){
    $rootScope.banner = 'none';
    $rootScope.about = 'signup';
    $scope.resetStatus = "waiting";

    $scope.activate = function() {
        $location.path('verifyemail/'+$scope.code);
    };

    $scope.resend = function() {
        $http.get('api/utility/resendvalidationcode/' + $scope.email)
            .success(function(data){
                if(data.success) {
                    $scope.resetStatus = "success";
                } else {
                    $scope.resetStatus = "error";
                }
            });
    }
}

function servicesProgramsController($rootScope, $scope, $routeParams, $location){
    $rootScope.about = 'service';
    $rootScope.service = $routeParams.service;

    $scope.location = $location;

    //$rootScope.serviceTitle = 'Access To Babson Curriculum';

    switch($routeParams.service){
        case 'access':
            $rootScope.serviceTitle = 'Access To Babson Curriculum';
            break;
        case 'facultydev':
            $rootScope.serviceTitle = 'Faculty Development';
            break;
        case 'nextopp':
            $rootScope.serviceTitle = 'Next Opportunity';
            break;
        case 'handbook':
            $rootScope.serviceTitle = 'Handbook';
            break;
        case 'entrepreneurship':
            $rootScope.serviceTitle = 'Entrepreneurship Center Development';
            break;
        case 'gceemsce':
            $rootScope.serviceTitle = 'GCEE MSCE';
            break;
    }
}

//i don't think this is being used anywhere.....
function MyCtrl2( $rootScope, $scope, $http, $log ) {
	$scope.protected = 'Not loaded';

	function ping() {
		$http.get( 'api/ping' ).success( function ( data ) {
			$log.info( 'Successfully retrieved protected resource.' );
			$scope.protected = data;
		} );
	}

	ping();
}
HomepageController.$inject = ['$rootScope', '$scope', '$http', '$location'];
MyCtrl2.$inject = ['$rootScope', '$scope', '$http', '$log'];


