'use strict';

/* Directives */


angular.module( 'bgc.directives', [] )
    .directive('profile', ['$http', function ($http) {
        return{
            restrict:'E',
            templateUrl:'lib/profile/partials/profileTemplate.html'
        }
    }])
    .directive('docViewer', function (){
        return{
            restrict:'E',
            template: '<iframe src="" style="width:98%; height:700px;" frameborder="3px"></iframe>',
            compile: function(element, attrs){
                var isGoogleDoc = false;

                if(attrs.googleDoc){
                    isGoogleDoc = attrs.googleDoc == 'true' ? true : false;
                }

                if(isGoogleDoc){
                    element[0].firstChild.src = attrs.url;
                }else{
                    element[0].firstChild.src = 'http://docs.google.com/viewer?url=' + attrs.url + '&embedded=true';
                }
            }
        }
    })
    .directive('passwordValidator', function(){
        return{
            require: 'ngModel',
            link: function(scope, elm, attr, ctrl) {
                var pwdWidget = elm.inheritedData('$formController')[attr.passwordValidator];

                ctrl.$parsers.push(function(value) {
                    if (value === pwdWidget.$viewValue) {
                        ctrl.$setValidity('MATCH', true);
                        return value;
                    }
                    ctrl.$setValidity('MATCH', false);
                });

                pwdWidget.$parsers.push(function(value) {
                    ctrl.$setValidity('MATCH', value === ctrl.$viewValue);
                    return value;
                });
            }
        };
    })
    .directive('pyklUpload', ['$auth', '$http', function($auth, $http){
        'use strict';
        //alert('Upload Directive!');

        //pyklConfig.upload = pyklConfig.upload || {};

        return{
            restrict: 'A',
            link:function (scope, elm, attrs) {
                var options = {};
                var cancelCropBtn;
                var saveCropBtn;

                var config = {
                    scope: scope,
                    runtimes: 'html5',
                    browse_button: 'choose-files',
                    container:'container',
                    url: '/gc/api/profiles/images/upload/',
                    max_file_size:'10mb',
                    resize:{width:320, height:240, quality:90},
                    flash_swf_url:'../js/plupload.flash.swf',
                    silverlight_xap_url:'../js/plupload.silverlight.xap',
                    filters:[
                        {title:"Image files", extensions:"jpg,gif,png,jpeg"},
                        {title:"Zip files", extensions:"zip"}
                    ]
                };

                if (attrs.pyklUpload) {
                    options = scope.$eval(attrs.pyklUpload);
                    if (options.dropTarget) {
                        config.drop_element = options.dropTarget;
                    }
                }

                //config = angular.extend({}, config, pyklConfig.upload);

                function $$(id) {
                    return document.getElementById(id);
                }

                var uploader = new plupload.Uploader(config);

                uploader.bind('FilesAdded', function (up, files) {
                    for (var i in files) {
                        $$('filelist').innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
                    }

                    setTimeout(function () {
                        uploader.start();
                    }, 500);
                });

                uploader.bind('UploadProgress', function (up, file) {
                    $$(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
                });

                var url;

                function fileUploaded(uploader, file, response) {
                    url = response.response;
                    //$$(config.drop_element).src = response.response;
                }

                uploader.bind('FileUploaded', fileUploaded);

                var jcropApi;

                uploader.bind('UploadComplete', function(uploader, file){
                    $('#image-crop').attr('src', url);

                    $('.modal.hide.fade').modal('show');

                    cancelCropBtn = angular.element('#cancel-crop');
                    saveCropBtn = angular.element('#save-crop');

                    $('.jcrop-holder img').attr('src', url);
                    $('#crop-preview').attr('src', url);

                    $('#image-crop').Jcrop({
                        bgColor: '#fff',
                        onChange: showPreview,
                        onSelect: showPreview,
                        aspectRatio: 0.83333333333333
                    }, function(){
                        jcropApi = this;
                    });

                    cancelCropBtn.bind('click', function(){
                        $('.modal.hide.fade').modal('hide');
                    });

                    saveCropBtn.bind('click', function(){
                        var rxp = /^.*cms\//;
                        var assetKey = url;

                        assetKey = assetKey.replace(rxp, "");

                        var coords = jcropApi.tellSelect();

                        var data = {
                            'x1':       coords.x,
                            'x2':       coords.x2,
                            'y1':       coords.y,
                            'y2':       coords.y2,
                            'w':    coords.w,
                            'h':   coords.h,
                            'assetKey': assetKey
                        };

                        var scope = config.scope;

                        $http.post('/gc/api/profiles/images/crop/', data).success(
                            function(data, status, headers, config){
                                var uri = data.response.uri;
                                uri = uri.replace(/http:/, '');
                                scope.thumbnailURI = uri;
                                $('#drop-target').attr('src', uri);
                            }
                        );

                        $('.modal.hide.fade').modal('hide');
                    });

                    function showPreview(coords){
                        var rx = 250 / coords.w;
                        var ry = 300 / coords.h;

                        $('#crop-preview').css({
                            width: Math.round(rx * 300) + 'px',
                            height: Math.round(ry * 360) + 'px',
                            marginLeft: '-' + Math.round(rx * coords.x) + 'px',
                            marginTop: '-' + Math.round(ry * coords.y) + 'px'
                        });
                    }
                });

                uploader.init();
            }
        }
    }]);
