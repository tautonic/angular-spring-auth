/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 10/8/12
 * Time: 3:28 PM
 * To change this template use File | Settings | File Templates.
 */
function SearchResourcesCtrl($scope, $http, $routeParams, $location, $parse, Search) {
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

