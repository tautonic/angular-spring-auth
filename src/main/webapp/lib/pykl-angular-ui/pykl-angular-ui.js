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
angular.module('pykl.directives').directive('pyklUpload', ['pykl.config', function(pyklConfig){
    'use strict';
    alert('Upload Directive!');

    pyklConfig.upload = pyklConfig.upload || {};

    return{
        restrict: 'A',
        link:function (scope, elm, attrs) {
            var options = {};

            var config = {
                container:'container',
                max_file_size:'10mb',
                url:'/gc/api/profiles/pics/1',
                resize:{width:320, height:240, quality:90},
                flash_swf_url:'../js/plupload.flash.swf',
                silverlight_xap_url:'../js/plupload.silverlight.xap',
                filters:[
                    {title:"Image files", extensions:"jpg,gif,png"},
                    {title:"Zip files", extensions:"zip"}
                ]
            };

            if (attrs.pyklUpload) {
                options = scope.$eval(attrs.pyklUpload);
                if (options.dropTarget) {
                    config.drop_element = options.dropTarget;
                }
            }

            config = angular.extend({}, config, pyklConfig.upload);

            function $(id) {
                return document.getElementById(id);
            }

            var uploader = new plupload.Uploader(config);

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