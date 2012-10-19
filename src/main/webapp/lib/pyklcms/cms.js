var cmsCtrl;

(function() {
    angular.module('pykl.cms', []);

    var CMS_EDIT_EVENT = '$pykl.cms-edit';

    /**
     * Controller that supports the editing of CMS content on a page.
     *
     * @param $scope
     * @param $http
     */
    cmsCtrl = function($scope, $http) {
        var cms;

        $scope.modalShown = false;
        $scope.cms = {
            title: '',
            description: '',
            thumbnailUrl: ''
        };

        $scope.submit = function() {


            cms.title = 'Who\'s your Daddy!';
            $scope.modalShown = false;
            cms = null;
        };

        $scope.$on(CMS_EDIT_EVENT, function(event, key, dispScope) {
            cms = dispScope.cms;
            $scope.$apply(function() {
                $scope.modalShown = true;
            });
        });
    };
    cmsCtrl.$inject = ['$scope', '$http'];

    /**
     * @ngdoc directive
     * @name pykl.content:cms
     *
     * @description
     * The `cms` directive will perform a lookup of CMS content from the serve, and substitute this
     * resulting content within the element it is associated. Any content within the associated element
     * will be replaced so content is not strictly necessary, however it can be helpful to include
     * placeholder content for documentation and static web development tools.
     *
     * The 'at' symbol (@) can't be used as part of the key value because it is dedicated as a separator
     * character which the CMS property uses to differentiate the key from the locale.
     * ( ie x-cms="<key>@<locale>" )
     *
     * @element ANY
     * @param {expression} Evaluates to the string key used to identify the CMS value. The
     *   expression can also be followed with '@<locale>' in order to force a locale-specific
     *   version of CMS content. If a locale is not supplied, the client's Accept-Language
     *   header will be used.
     *
     * @example
     <example>
     <h2><span x-cms="aside-1234">Faculty Stuff</span></h2>
     <p x-cms="notfound">Testing a not found case.</p>
     <blockquote x-cms="title/fr_CA">Forcing the French-Canadian version of the content.</blockquote>
     <th x-cms="name-title"/>
     </example>
     */
    angular.module('pykl.cms').directive('cms', ['$rootScope', '$http', '$auth',
        function ($rootScope, $http, $auth) {
            return {
                // Is applied as an element's attribute
                restrict: 'A',
                // Current content will be replaced
                replace: true,
                scope: {},
                compile: function (tElement, tAttrs, transclude) {
                    var editBtn;

                    // Adds an edit button to the upper right corner of the cms element
                    function attachEdit(element) {
                        editBtn = angular.element(
                            '<a ng-click="" class="btn btn-info btn-mini" style="position: absolute; right: 0; top:0">Edit</a>'
                        );
                        element
                            .css('position', 'relative')
                            .append(editBtn);
//                        hideEdit();
                        return editBtn;
                    }

                    function showEdit() {
                        editBtn.show();
                    }

                    function hideEdit() {
                        editBtn.hide();
                    }

                    return function (scope, element, attrs) {

                        // The cms property contains the lookup key
                        var key = attrs.cms;

                        // Create the edit button and add a handler that will trigger the modal edit dialog
                        attachEdit(element).click(function () {
                            console.log('Edit clicked, root scope: ', $rootScope);
                            console.log('broadcasting: ', CMS_EDIT_EVENT, key);
                            $rootScope.$broadcast(CMS_EDIT_EVENT, key, scope);
                        });


                        // Create the URL to use in order to return the CMS content and the locale if forced
                        var parts = key.split('@');
                        var url = 'api/cms/' + parts[0];
                        if (parts.length > 1) url = url + '?locale=' + parts[1];

                        // Make a GET request to the server in order to perform the CMS lookup
                        $http({method: 'GET', url: url})
                            .success(function (data, status, headers, config) {
                                // If the HTTP response is an array and the first element contains a content
                                // property, then we found what we were looking for.
                                var contentFound = data.length && data[0] && data[0].content;
                                if (contentFound) {
                                    // Populate the HTML element with content
                                    scope.cms = data[0];
                                } else {
                                    scope.cms = 'CMS CONTENT NOT FOUND!';
                                }
                            })
                            .error(function (data, status, headers, config) {
                                scope.cms = 'CMS CONTENT NOT FOUND!';
                            });
                    }
                }
            }
        }
    ]);
})();

