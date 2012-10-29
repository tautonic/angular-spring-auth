var pykl = window.pykl || {};

/**
 * todo: Determine some naming conventions. The service, directive, events and controller are all
 * over the board.
 * Proposed:
 *      Module: pykl.<module>    i.e. pykl.cms
 *     Service: name it according to the service it provides
 *   Directive:
 *  Controller: use the window.pykl namespace for the controller.
 *      Filter:
 */
(function(window, ng, undefined) {

    'use strict';

    var pyklCms = ng.module('pykl.cms', []);

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
            var args = Array.prototype.slice.call(arguments);
            // First argument is the lookup key
            key = args.shift();
            // Second argument may be locale (string) or success (function)
            locale = typeof args[0] === 'string' ? args.shift() : null;
            success = args.shift() || ng.noop;
            // If there is a final argument, it is an error handler
            error = args.shift() || ng.noop;

            // Create the URL to use in order to return the CMS content and the locale if forced
            var parts = key.split('@');
            var url = 'api/cms/' + parts[0];
            var loc = parts[1] || locale;
            if (parts.length > 1) url = url + '?locale=' + loc;

            // Make a GET request to the server in order to perform the CMS lookup
            $http({method: 'GET', url: url}).success(success).error(error);
        }

        /**
         * Updates an existing resource on the server.
         *
         * @param resource
         * @param {Function} [success] A callback function upon successful update of resource. Parameter to callback
         * will be the updated resource object.
         * @param {Function} [error] Called when there is a critical server error.
         */
        function putResource(resource, success, error) {
            var args = Array.prototype.slice.call(arguments);
            // First argument is the resource
            resource = args.shift();
            success = args.shift() || ng.noop();
            error = args.shift() || ng.noop();

            var url = 'api/cms/' + resource._id;

            // Make a PUT request to the server in order to update the resource
            $http({method: 'PUT', url: url, data: resource})
                .success(success).error(error);
        }

        return {
            getResources: getResources,
            putResource: putResource
        }
    }] );

    /**
     * Controller that supports the editing of CMS content on a page.
     *
     * @param $scope
     * @param $http
     */
    pykl.cmsCtrl = function($scope, $cms, $http) {
        // Stores the original array of incoming data. This object is used to diff against the updated set of resources
        // to determine whether a persist needs to take place.
        var origData;

        // Controls whether the CMS dialog box is visible or not.
        $scope.modalShown = false;

        // resources is an array that contains the various versions (locales) for the given 'key' value.
        $scope.resources = [];

        /**
         * The user has submitted the
         */
        $scope.submit = function() {
            console.log('Updated values: ', $scope.resources);
            var modifiedResources = $scope.resources.filter(modified);
            ng.forEach(modifiedResources, persist);
            $scope.modalShown = false;
        };

        $scope.cancel = function() {
            console.log('Cancel pressed');
            $scope.modalShown = false;
        };


        /**
         * Makes an update request to the server to modify a modified resource.
         * @param resource
         */
        function persist(resource) {
            $cms.putResource(resource);
        }

        /**
         * Determines if the potentially user-modified resource has the same key values as the original one did.
         *
         * @param resource The resource coming from the UI. May be modified.
         * @param index The index of the original element in the array. Used to extract the appropriate resource
         * from the original data for comparison.
         * @return {Boolean} True if the resource has been modified. False if it is the same.
         */
        function modified(resource, index) {
            var old = origData[index];
            return !(resource.title === old.title
                && resource.content === old.content
                && resource.thumbnailUrl === old.thumbnailUrl);
        }

        // dispScope.cms is the object bound to the existing display component the user is wanting to
        // edit. At the end of the edit process, this object should be updated to reflect the changes.
        $scope.$on(CMS_EDIT_EVENT, function(event, key, locale, dispScope) {
            /**
             * Function called with an array of all resources (regardless of locale) containing the key.
             * todo: Eventually add support for multiple locales
             * @param data
             */
            var update = function(data) {
                console.log('Received content for key', key, data);
                // todo: To simplify things for the time being, we are forcing only a single english resource
                data = data.filter(function (resource) {
                    return resource.locale === 'en';
                });
                $scope.resources = data;
                origData = ng.copy(data);
                $scope.modalShown = true;
            };

            $cms.getResources(key, update);

        });
    };
    pykl.cmsCtrl.$inject = ['$scope', 'pykl.$cms', '$http'];

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
    pyklCms.directive('cms', ['$rootScope', '$http', 'pykl.$cms', '$window', '$auth',
        function ($rootScope, $http, $cms, $window, $auth) {
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
                        editBtn = ng.element(
                            '<a ng-click="" class="btn btn-info btn-mini" style="position: absolute; right: 0; top:0">Edit</a>'
                        );
                        element
                            .css('position', 'relative')
                            .append(editBtn);
                        hideEdit();
                        return editBtn;
                    }

                    function showEdit() {
                        editBtn.show();
                    }

                    function hideEdit() {
                        editBtn.hide();
                    }

                    function displayOnAuth() {
                        console.log('Auth', $auth, 'Editor? ', $auth.isUserInRole('ROLE_EDITOR'));
                        if ($auth.isUserInRole('ROLE_EDITOR')) showEdit(); else hideEdit();
                    }

                    $rootScope.$on( $auth.event.signinConfirmed, displayOnAuth);
                    $rootScope.$on( $auth.event.signoutConfirmed, hideEdit);

                    return function (scope, element, attrs) {

                        // The cms property contains the lookup key
                        var key = attrs.cms;
                        // todo Override the $local service or provide a new service that can detect user's
                        // locale using cookies or server-side call w/ callback
                        var locale = $window.navigator.userLanguage || $window.navigator.language || 'en';

                        // Create the edit button and add a handler that will trigger the modal edit dialog
                        attachEdit(element).click(function () {
                            console.log('Edit clicked, root scope: ', $rootScope,
                                'broadcasting: ', CMS_EDIT_EVENT, key);
                            $rootScope.$broadcast(CMS_EDIT_EVENT, key, locale, scope);
                        });
                        displayOnAuth();

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

                        var lookup = key;
                        if (locale) lookup += '@' + locale;
                        console.log('CMS Directive, fetching resource {}', lookup);
                        $cms.getResources(lookup, updateScope);
                    }
                }
            }
        }
    ]);
})(window, window.angular, undefined);
