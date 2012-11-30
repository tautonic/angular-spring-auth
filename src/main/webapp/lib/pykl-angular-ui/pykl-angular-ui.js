/**
 * AngularJS directives and filters for Pykl Studios
 * @version v1.0.0 - 2012-09-17
 * @link https://github.com/pykl/angular-comps
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

var pykl = window.pykl || {};

(function (window, angular, undefined) {

    'use strict';

    angular.module('pykl-ui.config', []).value('pykl-ui.config', {});
    angular.module('pykl-ui.filters', ['pykl-ui.config']);
    angular.module('pykl-ui.directives', ['pykl-ui.config']);

    angular.module('pykl-ui', ['pykl-ui.directives', 'pykl-ui.config']);


    /**
     * @ngdoc directive
     * @name pykl-ui.directives:imgUpload
     *
     * @description
     * Simplifies the use of image upload by making it dead simple to integrate on the
     * page. There is some config that must be set up, but sensible defaults and the
     * uploading of a single file reduces the options significantly.
     *
     * @element ANY
     * @param {expression} Contains a config object that controls the capabilities of the plupload plugin.
     *
     * @example
     * <example>
     *    <img x-img-upload="{ max_file_size: '3mb', resize: { width: 320, height: 240 } }" src="{{thumbnail_url}}" />
     * </example>
     *
     */
    angular.module('pykl-ui.directives').directive('imgUpload',
        ['pykl-ui.config', '$log', function (pyklConfig, $log) {
            var overlay;

            var browseButton = angular.element('<button class="btn btn-success" id="pickfiles">Browse</button>');

            function addOverlay(elm) {
                // The overlay will be absolutely positioned above the image element. In order
                // to accomplish this, we must set the elm to relative positioning.
                elm.css('position', 'relative');

                // Locate the image tag within the directive scope that will be updated (hint: it
                // contains the imgUpload class.
                var img = $('img.imgUpload', elm)
                    .css('position', 'relative');

                overlay = angular.element('<div class="overlay"></div>')
                    .css({
                        position: 'absolute',
                        zIndex: 2,
                        opacity: 1,
                        width: 200, height: 200
                    })
                    .append(browseButton)
                    .prependTo(elm)
                    .hover(
                        function () { $(this).animate({opacity: 1}, 150) },
                        function () { $(this).animate({opacity: 0}, 150) });

                // Once the image loads, we will know its positioning and size, so the overlay
                // can then be positioned.
                img.load(function (e) {
                    var $this = $(this);
                    var opts = {
                        top: $this.position().top + (($this.outerHeight(true) - $this.height()) >> 1),
                        left: $this.position().left + (($this.outerWidth(true) - $this.width()) >> 1),
                        width: $this.width(),
                        height: $this.height()
                    };
                    $log.info('On image load', opts);
                    overlay.css(opts);
                });
            }

            function updateOverlay(acceptDragAndDrop) {
                if (acceptDragAndDrop) overlay.prepend('<h1>Drag and Drop or</h1>');
            }

            return {
                restrict: 'A',
                link: function (scope, elm, attrs) {
                    var options = attrs.imgUpload ? scope.$eval(attrs.imgUpload) : {};
                    options = angular.extend({
                        url: './api/cms/upload/image',
                        runtimes: 'html5',
                        browse_button: 'pickfiles',
                        drop_element: 'target',
//                        container: 'container',
                        max_file_size: '10mb',
                        filters: [
                            {title: "Image files", extensions: "jpg,gif,png"},
                            {title: "Zip files", extensions: "zip"}
                        ],
                        resize: {width: 320, height: 240, quality: 90}

                    }, pyklConfig.imgUpload, options);

                    addOverlay(elm);

                    // Initialize the plupload upload library (http://www.plupload.com/documentation.php#configuration)
                    var uploader = new plupload.Uploader(options);
                    $log.info('Uploader options', options);

                    // Update the overlay with the appropriate messaging if drag & drop is supported.
                    uploader.bind('Init', function (up) {
                        $log.info('Init', arguments);
                        updateOverlay(up.features.dragdrop);
                    });

                    // Start the upload process when a file is added to the queue.
                    uploader.bind('FilesAdded', function (up, files) {
                        $log.info('FilesAdded', arguments);
                        setTimeout(function () {
                            up.start();
                        }, 0);
                    });

                    uploader.bind('FileUploaded', function (up, file, response) {
                        $log.info('FileUploaded', arguments);
                    });

                    uploader.bind('UploadProgress', function (up, file) {
                        $log.info('UploadProgress', arguments);
                    });

                    uploader.init();

                    $log.info('Plupload is using runtime:', uploader.runtime);
                }
            }
        }]);
})(window, window.angular);

