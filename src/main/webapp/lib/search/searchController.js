/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 10/10/12
 * Time: 5:20 PM
 * To change this template use File | Settings | File Templates.
 */
function SearchContent($scope, $http, $routeParams, $location, $parse, Search) {
    $scope.results = {};

    var data = {
        q: $routeParams.query
    };

    var results = Search.content({type: 'content'}, data, function(response){
        $scope.results = response.content;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });

    $scope.search_content = function(){
        $location.path('/search/content');
    }
}

function SearchDiscussions($scope, $http, $routeParams, $location, $parse, Search) {
    $scope.results;

    var data = {
        q: $routeParams.query
    };

    var results = Search.discussions({type: 'site'}, data, function(response){
        $scope.results = response.content;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}

function SearchProfiles($rootScope, $scope, $http, $routeParams, $location, $parse, Search) {
    $scope.results = {};

    var data = {
        q: $routeParams.query
    };

    var results = Search.faculty({type: 'faculty'}, data, function(response){
        $scope.results = response.content;
    }, function(response){
        console.log('Faculty search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}

function SearchSite($scope, $http, $routeParams, $location, $parse, Search) {
    $scope.results;

    var data = {
        q: $routeParams.query
    };

    var results = Search.site({type: 'site'}, data, function(response){
        $scope.results = response.content;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}
