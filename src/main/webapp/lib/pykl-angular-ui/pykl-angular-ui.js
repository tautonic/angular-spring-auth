/**
 * AngularJS directives and filters for Pykl Studios
 * @version v1.0.0 - 2012-09-17
 * @link https://github.com/pykl/angular-comps
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

angular.module('pykl.config', []).value('pykl.config', {});
angular.module('pykl.filters', ['pykl.config']);
angular.module('pykl.directives', ['pykl.config']);
angular.module('pykl', ['pykl.directives', 'pykl.config']);

angular.module( 'pykl.directives')
    .directive('abc', function () {
        return function (scope, element, attrs) {
            element.css({
                border: '10px solid red'
            })
        }
    });


/**
 * Async email validation
 */
angular.module('pykl.directives').directive('pyklEmailValidator', ['pykl.config', '$http', function(pyklConfig, $http){
    'use strict';

    pyklConfig.asyncEmail = pyklConfig.asyncEmail || {};

    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl){

            ctrl.$parsers.unshift(function(viewValue){
                $http.get(pyklConfig.asyncEmail.url + viewValue).success(function(data){
                    console.log(data);
                    if(data === 'true'){
                        ctrl.$setValidity('pyklEmailValidator', true);
                        return viewValue;
                    }else{
                        ctrl.$setValidity('pyklEmailValidator', false);
                        return undefined;
                    }
                }).error(function(data, status){
                        console.log(status);
                    });
            });
        }
    }
}]);
/**
 * Pykl Studios directives and filters
 */

/**
 * Adds file upload functionality using the Plupload plugin
 */
angular.module('pykl.directives').directive('pyklUpload', ['pykl.config', function (pyklConfig) {
    'use strict';
    alert('Upload Directive!');

    pyklConfig.upload = pyklConfig.upload || {};

    return {
        restrict: 'A',
        link: function (scope, elm, attrs) {
            var config = {
                container: 'container',
                max_file_size: '10mb',
                url: 'api/profiles/pics/1',
                resize: {width: 320, height: 240, quality: 90},
                flash_swf_url: '../js/plupload.flash.swf',
                silverlight_xap_url: '../js/plupload.silverlight.xap',
                filters: [
                    {title: "Image files", extensions: "jpg,gif,png"},
                    {title: "Zip files", extensions: "zip"}
                ]
            };

            // pyklUpload is the directive name and as an attribute it can specify a series of configuration options
            // which will override the default configuration for plupload.
            //   i.e.  <div pykl-upload="{drop_element:'drop-target', filters: [{title: 'Images', extensions:'jpg,jpeg,gif,png'}]}">
            var options = {};
            if (attrs.pyklUpload) {
                options = scope.$eval(attrs.pyklUpload);
                // todo: Eventually remove the use of dropTarget. We already have drop_element in the config params.
                if (options.dropTarget) options.drop_element = options.dropTarget;
                // plupload wants the id of a block element to append file objects into. If one is not specified, we
                // will create an invisible div
                if (!options.container) {

                }
            }

            // Config parameters hierarchy (top-most overrides lower)
            // pyklUpload="{options}"
            //     pyklConfig.upload
            //        config (hardcoded and should be removed at some point)
            config = angular.extend({}, config, pyklConfig.upload, options);

            // Initialize the plupload upload library (http://www.plupload.com/documentation.php#configuration)
            var uploader = new plupload.Uploader(config);

            // These handlers are dependent upon certain DOM elements with specific ID values. I would allow the client
            // code to bind to the uploader instead of this very hardcoded implementation. --jc 20121120
            uploader.bind('FilesAdded', function (up, files) {
                for (var i in files) {
                    $('filelist').innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
                }

                setTimeout(function () {
                    uploader.start();
                }, 500);
            });

            uploader.bind('UploadProgress', function (up, file) {
                $(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            });

            uploader.bind('FileUploaded', function (uploader, file, response) {
                console.log(uploader, file, response);
                $(config.drop_element).src = response.response;
            });

            uploader.init();
        }
    }
}]);



/**
 * @ngdoc directive
 * @name pykl.directives:imgUpload
 *
 * @description
 * Simplifies the use of image upload by making it dead simple to integrate on the page. There is some config that must
 * be set up, but sensible defaults and the uploading of a single file reduces the options significantly.
 *
 * @element <img> Images
 * @param {expression} Contains a config object that controls the capabilities of the plupload plugin.
 *
 * @example
 * <example>
 *    <img x-img-upload="{ max_file_size: '3mb', resize: { width: 320, height: 240 } }" src="{{thumbnail_url}}" />
 * </example>
 *
 */
angular.module('pykl.directives').directive('upload', ['pykl.config', function (pyklConfig) {
    throw 'error';

    pyklConfig.imgUpload = pyklConfig.imgUpload || {};


    return {
        restrict: 'A',
        link: function (scope, elm, attrs) {

            // The elm is an image tag and we want to add an overlay that fits over the top of the image.
            var container = angular.element('<div style="position: relative"></div>')
                .width(elm.width())
                .height(elm.height())
                .insertBefore(elm);

            // Add an overlay that lets the user know they can drag and drop or click on the image to start the file
            // upload process.
            var overlay = angular.element('<div>Drag and Drop</div>')
                .css({
                    position: absolute,
                    zIndex: 2,
                    top: 0,
                    left: 0,
                    backgroundColor: '#333333',
                    opacity: 0.5
                });
            container.append(overlay).append(elm.css({
                position: absolute,
                zIndex: 1,
                top: 0,
                left: 0
            }));

            // imgUpload is the directive name and as an attribute it can specify a series of configuration options
            // which will override the default configuration for plupload.

            var options = attrs.imgUpload ? scope.$eval(attrs.imgUpload) : {};
            options = angular.extend({}, pyklConfig.imgUpload, options);

            // Initialize the plupload upload library (http://www.plupload.com/documentation.php#configuration)
            var uploader = new plupload.Uploader(options);

            uploader.init();
        }
    }
}]);