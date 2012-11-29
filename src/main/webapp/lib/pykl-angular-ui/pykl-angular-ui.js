/**
 * AngularJS directives and filters for Pykl Studios
 * @version v1.0.0 - 2012-09-17
 * @link https://github.com/pykl/angular-comps
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

var pykl = window.pykl || {};

(function (window, ng, undefined) {

    'use strict';

    ng.module('pykl-ui.config', []).value('pykl-ui.config', {});
    ng.module('pykl-ui.filters', ['pykl-ui.config']);
    ng.module('pykl-ui.directives', ['pykl-ui.config']);

    ng.module('pykl-ui', ['pykl-ui.directives', 'pykl-ui.config']);


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
    ng.module('pykl-ui.directives').directive('imgUpload',
        ['pykl-ui.config', '$log', function (pyklConfig, $log) {
            var overlay, panel, img, browseButton;

            var uid = Math.round(13 * Math.random() * Math.random() * 100000) + '';

            var id_browseButton = 'browse_' + uid;
            var id_dropTarget = 'drop_' + uid;

            function showOverlay() {
                overlay.removeClass('hide');
                overlay.addClass('show')
            }

            function hideOverlay() {
                overlay.removeClass('show');
                overlay.addClass('hide')
            }

            function showPanel() {
                $log.info('Show panel');
                panel.removeClass('hide');
                panel.addClass('show')
            }

            function hidePanel() {
                $log.info('Hide panel');
                panel.removeClass('show');
                panel.addClass('hide')
            }

            // The overlay is a drag and drop target containing
            function addOverlay(elm) {
                overlay = ng.element('<div class="overlay hide"></div>')
                    .prependTo(elm)
                    .attr('id', id_dropTarget);
            }

            function addPanel(elm) {
                browseButton = ng.element('<button class="browse btn">Browse</button>')
                    .attr('id', id_browseButton);

                panel = ng.element('<div class="panel hide"></div>')
                    .prependTo(elm)
                    .append(browseButton);
                elm.hover(showPanel, hidePanel);
            }

            function locateImage(elm) {
                var img = $('img.imgUpload', elm).css('position', 'relative');

                // Once the image loads, we will know its positioning and size, so the overlay
                // and panel can then be positioned.
                img.load(function (e) {
                    var $this = $(this);
                    // todo: These calcs depend on top/bottom and left/right margins/padding/border being the same values
                    var imageTop = $this.position().top + (($this.outerHeight(true) - $this.height()) >> 1);
                    var imageLeft = $this.position().left + (($this.outerWidth(true) - $this.width()) >> 1);
                    overlay.css({
                        top: imageTop,
                        left: imageLeft,
                        width: $this.width(),
                        height: $this.height()
                    });
                    panel.css({
                        width: $this.width()
                    });
                });
            }

            function initPlupload(features) {
                if (features.dragdrop) {
                    overlay.prepend('<h1>Drag and Drop</h1>');
                    overlay.bind('dragover', showOverlay);
                    overlay.bind('dragleave', hideOverlay);
                }
            }

            return {
                restrict: 'A',
                link: function (scope, elm, attrs, ngModel) {
                    var options = attrs.imgUpload ? scope.$eval(attrs.imgUpload) : {};
                    options = ng.extend({
                        url: './api/cms/upload/image',
                        runtimes: 'html5',
                        browse_button: id_browseButton,
                        drop_element: id_dropTarget,
//                        container: 'container',
                        max_file_size: '10mb',
                        filters: [
                            {title: "Image files", extensions: "jpg,gif,png"},
                            {title: "Zip files", extensions: "zip"}
                        ],
                        resize: {width: 320, height: 240, quality: 90}

                    }, pyklConfig.imgUpload, options);

                    // Locate the image tag within the directive scope that will be updated (hint: it
                    // contains the imgUpload class.
                    img = locateImage(elm);

                    // The image's src is updated to the value stored in ngModel
                    ngModel.$render = function() {
                        img.src(ngModel.$viewValue || '');
                    };

                    // The overlay will be absolutely positioned above the image element. In order
                    // to accomplish this, we must set the elm to relative positioning.
                    elm.css('position', 'relative');

                    addOverlay(elm);
                    addPanel(elm);

                    // Initialize the plupload upload library (http://www.plupload.com/documentation.php#configuration)
                    var uploader = new plupload.Uploader(options);
                    $log.info('Uploader options', options);

                    // Update the overlay with the appropriate messaging if drag & drop is supported.
                    uploader.bind('Init', function (up) {
                        $log.info('Init', arguments);
                        initPlupload(up.features);
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

