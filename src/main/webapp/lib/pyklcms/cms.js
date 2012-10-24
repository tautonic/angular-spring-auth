var pykl = window.pykl || {};

/**
 * todo: Determine some naming conventions. The service, directive, events and controller are all
 * over the board.
 */
(function(window, angular, undefined) {

    'use strict';

    var pyklCms = angular.module('pykl', []);

    var CMS_EDIT_EVENT = '$pykl.cms-edit';

    /**
     * @ngdoc object
     * @name pykl.cms
     * @requires $http
     *
     * @description
     * A service which will query the server for CMS resources.
     *
     * @example
     *
     */
    pyklCms.factory( 'pykl.$cms', ['$rootScope', '$http', '$log', function ( $rootScope, $http, $log ) {

        /**
         * Fetches a list of resources from the server based on the supplied key. The locale field is
         * optional. If it is not supplied the result will contain all locales for the provided key.
         * If it is supplied, the result will contain the "most appropriate" match for the provided
         * locale. This does not imply an exact match, although it will be an exact match if the exact
         * locale is found. If an exact locale is not found, the locale degradation rules will result
         * in the "best" result being returned.
         *
         * Success callback is required, and will be invoked with a data argument which contains an
         * array of the matching resources. If the optional error callback is provided, it will be
         * invoked in the event of some server-side error. Note that an empty result will be returned
         * to the success handler as an empty array.
         *
         * @param {String} key The lookup value for the resource. Can include an '@' symbol followed by
         * locale as an alternate means of providing the locale to this function.
         * @param {String} [locale] A combination of language and optional country code separated with
         * an underscore. Language codes are specified by ISO-639 and country codes are in ISO-3166.
         * @param {Function} success A callback function upon successful retrieval of resource. Will
         * contain an array of results. No match found will return an empty array.
         * @param {Function} [error] Called when there is a critical server error.
         */
        function getResources(key, locale, success, error) {
            var args = Array.prototype.slice(arguments,0);
            // First argument is the lookup key
            key = args.shift();
            // Second argument may be locale (string) or success (function)
            locale = typeof args[0] === 'string' ? args.shift() : null;
            success = args.shift();
            // If there is a final argument, it is an error handler
            error = args.shift();

            // Create the URL to use in order to return the CMS content and the locale if forced
            var parts = key.split('@');
            var url = 'api/cms/' + parts[0];
            var loc = parts[1] || locale;
            if (parts.length > 1) url = url + '?locale=' + loc;

            // Make a GET request to the server in order to perform the CMS lookup
            $http({method: 'GET', url: url})
                .success(updateScope).error(updateScope);
        }

        return {
            getResources: getResources
        }
    }] );

    /**
     * Controller that supports the editing of CMS content on a page.
     *
     * @param $scope
     * @param $http
     */
    pykl.cmsCtrl = function($scope, $http) {
        var cms;

        $scope.modalShown = false;
        $scope.cms = {
            title: '',
            content: '',
            thumbnailUrl: ''
        };

        $scope.submit = function() {
            cms.title = 'Who\'s your Daddy!';
            $scope.modalShown = false;
            cms = null;
        };

        $scope.cancel = function() {
            console.log('Cancel pressed');
            $scope.modalShown = false;
            cms = null;
        };

        $scope.$on(CMS_EDIT_EVENT, function(event, key, dispScope) {
            $scope.cms = cms = dispScope.cms;

            // Would love to know why this only works when I enclose it in scope.$apply(), but always throws a
            // '$digest already in progress' error when I do so.
            $scope.$apply(function() {
                $scope.modalShown = true;
            });
        });
    };
    pykl.cmsCtrl.$inject = ['$scope', '$http'];

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
     * ( ie x-cms="<key>@<locale>" or x-cms="footer@fr_CA" )
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
    pyklCms.directive('cms', ['$rootScope', '$http', 'pykl.$cms', '$auth',
        function ($rootScope, $http, $cms, $auth) {
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

                        var updateScope = function(data) {
                            // If the HTTP response is an array and the first element contains a content
                            // property, then we found what we were looking for.
                            var contentFound = data && data.length && data[0] && data[0].content;
                            if (contentFound) {
                                // Populate the HTML element with content
                                scope.cms = data[0];
                            } else {
                                scope.cms = 'CMS CONTENT NOT FOUND!';
                            }
                        };

                        $cms.getResources(key, updateScope);
                    }
                }
            }
        }
    ]);
})(window, window.angular, undefined);
