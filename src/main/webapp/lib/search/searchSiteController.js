/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 10/8/12
 * Time: 2:37 PM
 * To change this template use File | Settings | File Templates.
 */
function SearchSiteCtrl($scope, $http, $routeParams, $location, $parse, Search) {
    $scope.results = {};

    var data = {
        q: $routeParams.query
    };

    var results = Search.site({type: 'site'}, data, function(response){
        $scope.results = response.content;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}
