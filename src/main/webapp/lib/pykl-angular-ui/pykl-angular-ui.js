/**
 * AngularJS directives and filters for Pykl Studios
 * @version v1.0.0 - 2012-09-17
 * @link https://github.com/pykl/angular-comps
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

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
     * There is a fair amount of boilerplate that is added to the user's original image tag.
     *
     * UI experimentation was done here:
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
            var container;

            var uid = Math.round(13 * Math.random() * Math.random() * 100000) + '';
            var idBrowseButton = 'browse_' + uid;
            var idDropTarget = 'drop_' + uid;

            function applyImageHandlers(img) {
                // Once the image loads, we will know its positioning and size, and then we will
                // adjust the size of the parent container.
                img.load(function (e) {
                    var $this = $(this);
                    container.css({
                        width: $this.width(),
                        height: $this.height()
                    });
                });
            }

            function initPlupload(features) {
                if (features.dragdrop) {
                    ng.element('div.browse p').prepend('Drag and Drop or ');
                    container.bind('dragover', function() {
                        $(this).addClass('dragover');
                    });
                    container.bind('dragleave', function() {
                        $(this).removeClass('dragover');
                    });
                    container.bind('drop', function() {
                        $(this).removeClass('dragover');
                    });
                } else {
                    ng.element('div.drop').remove();
                }
            }

            return {
                template: '\
                    <div class="img-upload"> \
                        <div class="fade"> \
                            <div class="drop"><p>Drop files here</p></div> \
                        </div> \
                        <div class="browse"> \
                            <p><button class="btn btn-success">Browse</button></p> \
                        </div> \
                        <div class="working"> \
                            <div>[x]</div> \
                            <div class="progress progress-striped active"> \
                                <div class="bar"></div> \
                            </div> \
                            <div class="name"></div> \
                        </div> \
                        <div id="base_image" /> \
                    </div>',
                replace: true,
                restrict: 'EA',
                require: '?ngModel',
                link: function (scope, elm, attrs, ngModel) {
                    // Initialize options
                    var options = attrs.imgUpload ? scope.$eval(attrs.imgUpload) : {};
                    options = ng.extend({
                        url: './api/cms/upload/image',
                        runtimes: 'html5',
                        browse_button: idBrowseButton,
                        drop_element: idDropTarget,
                        max_file_size: '10mb',
                        filters: [
                            {title: "Image files", extensions: "jpg,gif,png"},
                            {title: "Zip files", extensions: "zip"}
                        ],
                        resize: {width: 320, height: 240, quality: 90}

                    }, pyklConfig.imgUpload, options);

                    // Locate the primary container
                    container = elm;

                    // Identify the transclude div
                    //note: ng-transclude creates a new scope, which can have a null parent value, which causes all sorts of unexpected behaviour (the scope doesn't get properly deleted, which results in copies being left around)
                    // see: https://github.com/angular/angular.js/issues/1627 for details
                    var elTransclude = container.find('#base_image');

                    // Locate the image. If not found create one and place in transclude holder.
                    var img = elTransclude.find('img');
                    if (img.length === 0) img = ng.element('<img />').appendTo(elTransclude);
                    applyImageHandlers(img);

                    // The image's src is updated to the value stored in ngModel
                    ngModel.$render = function() {
                        $log.info('Received render call', arguments);
                        img.attr('src', ngModel.$viewValue || '');
                    };

                    // The plupload libraries requires a few of our elements to have set
                    // id values (that we generated earlier)
                    container.find('div.browse button').attr('id', idBrowseButton);
                    container.find('div.drop').attr('id', idDropTarget);

                    // Content areas
                    var elName = container.find('div.name');
                    var elProgressBar = container.find('div.bar');

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
                        container.addClass('inprogress');
                        elName.html(files[0].name);
                        elProgressBar.width(0);
                        setTimeout(function () {
                            up.start();
                        }, 0);
                    });

                    var jcropApi;
                    var url;

                    uploader.bind('FileUploaded', function (up, file, response) {
                        $log.info('FileUploaded', arguments);
                        // Update the model with the new URL
                        if (response.status == 200) {
                            response = ng.fromJson(response.response);
                            if (response.file && response.file.uri) {
                                url = response.file.uri;
                                container.removeClass('inprogress');
                                scope.$apply(function() {
                                    ngModel.$setViewValue(response.file.uri);
                                    img.attr('src', ngModel.$viewValue || '');
                                });
                                $log.info('Updating model to new image src:', response.file.uri);
                            }
                        }
                    });

                    uploader.bind('UploadComplete', function(uploader, file){
                        //$('.jcrop-holder img').attr('src', url);

                        $('#base_image img').attr('src', url);

                        $('#base_image img').Jcrop({
                            bgColor: '#fff',
                            aspectRatio: 1
                        }, function(){
                            jcropApi = this;
                            var cropDimensions = Math.min(parseInt($('#base_image img').width()), parseInt($('#base_image img').height()));

                            var distanceToCropCenter = Math.floor(cropDimensions/2);
                            var distanceToImageCenter = Math.floor($('#base_image img').width()/2);

                            var shiftCropToCenter = Math.abs(distanceToCropCenter - distanceToImageCenter);

                            jcropApi.setSelect([shiftCropToCenter, 0, cropDimensions, cropDimensions]);

                            //scope.$apply();
                        });
                    });

                    uploader.bind('UploadProgress', function (up, file) {
                        $log.info('UploadProgress', arguments);
                        elProgressBar.width(file.percent + '%');
                    });

                    uploader.init();

                    $log.info('Plupload is using runtime:', uploader.runtime);
                }
            }
        }]);
})(window, window.angular);

