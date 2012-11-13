/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 10/10/12
 * Time: 5:20 PM
 * To change this template use File | Settings | File Templates.
 */
function SearchSite($rootScope, $scope, $routeParams, $location, Search, $http) {
    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.filter = {

    };

    $scope.allTypes;

    $scope.facets;

    $scope.results;
    $scope.query;
    $scope.noResults = false;

    var data = {
        q: $routeParams.query
    };

    var results = Search.site({type: 'site'}, data, function(response){
        $scope.results = response.content;
        $scope.facets = response.facets;

        $scope.allTypes = true;

        // create a scope object for each facet term
        for(var facet in $scope.facets){
            //var term =
            $scope.facets[facet].selected = false;
        }

        $scope.resultLength = response.content.length;

        if($scope.resultLength === 0){
            $scope.noResults = true;
        }

        $scope.query = $routeParams.query;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });

    $scope.filteredSearch = function(checked, id){
        var dataType = [];

        $scope.allTypes = false;
        console.log('search ' + id + ' is ' + checked);

        for(var facet in $scope.facets){
            if($scope.facets[facet].selected === true){
                dataType.push($scope.facets[facet].term);
            }
        }

        dataType = dataType.join(',');

        var data = {
            q: $scope.query,
            dataType: dataType
        };

        //dataType = [];
        $http.post('api/search/site/', data)
            .success(function(response){
                console.log('Success! Search request was successful');
                $scope.results = response.content;
            })
            .error(function(){
                console.log('Error! Search request was successful');
            });
    }

    $scope.searchAll = function(){
        if($scope.allTypes === false){
            var data = {
                q: $scope.query
            };

            //dataType = [];
            $http.post('api/search/site/', data)
                .success(function(response){
                    $scope.results = response.content;
                    console.log('Success! Search request was successful');
                })
                .error(function(){
                    console.log('Error! Search request was successful');
                });

            $scope.allTypes = true;
        }else{
            $scope.allTypes = false;
        }

        for(var facet in $scope.facets){
            $scope.facets[facet].selected = false;
        }
    }
}

function SearchContent($scope, $routeParams, $location, Search) {
    $scope.results = {};

    var data = {
        q: $routeParams.query
    };

    var results = Search.content({type: 'content'}, data, function(response){
        $scope.results = response.content;
        $scope.resultLength = response.content.length;
        $scope.query = $routeParams.query;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}

function SearchDiscussions($rootScope, $scope, $routeParams, $location, Search) {
    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.results;

    var data = {
        q: $routeParams.query
    };

    var results = Search.discussions({type: 'discussions'}, data, function(response){
        $scope.results = response.content;
        $scope.resultLength = response.content.length;
        $scope.query = $routeParams.query;
    }, function(response){
        console.log('Profile search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}

function SearchProfiles($rootScope, $scope, $routeParams, $location, Search) {
    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.results = {};

    var data = {
        q: $routeParams.query
    };

    var results = Search.faculty({type: 'faculty'}, data, function(response){
        $scope.results = response.content;
        $scope.resultLength = response.content.length;
        $scope.query = $routeParams.query;
    }, function(response){
        console.log('Faculty search ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
    });
}