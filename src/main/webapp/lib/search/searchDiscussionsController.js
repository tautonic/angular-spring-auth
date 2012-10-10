/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 10/10/12
 * Time: 4:08 PM
 * To change this template use File | Settings | File Templates.
 */
function SearchDiscussionsCtrl($scope, $http, $routeParams, $location, $parse, Search) {
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
