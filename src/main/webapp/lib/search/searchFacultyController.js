/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 10/8/12
 * Time: 9:23 AM
 * To change this template use File | Settings | File Templates.
 */
function SearchProfilesCtrl($rootScope, $scope, $http, $routeParams, $location, $parse, Search) {
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
