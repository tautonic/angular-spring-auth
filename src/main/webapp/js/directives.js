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
            template: '<iframe src="" style="margin: 2em 0 0 2em; width:50%; height:700px;" frameborder="3px"></iframe>',
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
            restrict: 'A',
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
    .directive('pyklUpload', ['$http', function($http){
        'use strict';
        //alert('Upload Directive!');

        //pyklConfig.upload = pyklConfig.upload || {};

        return{
            restrict: 'A',
            link:function (scope, elm, attrs) {
                var options = {};
                var cancelCropBtn;
                var saveCropBtn;

                options = scope.$eval(attrs.pyklUpload);

                var config = {
                    scope: scope,
                    runtimes: 'html5',
                    browse_button: 'choose-files-' + options.mode,
                    container:'container-' + options.mode,
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
                        $$('filelist-' + options.mode).innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
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
                }

                uploader.bind('FileUploaded', fileUploaded);

                var jcropApi;

                uploader.bind('UploadComplete', function(uploader, file){
                    $('#image-crop-' + options.mode).attr('src', url);

                    $('.modal.hide.fade.' + options.mode).modal('show');

                    cancelCropBtn = angular.element('#cancel-crop-' + options.mode);
                    saveCropBtn = angular.element('#save-crop-' + options.mode);

                    $('.jcrop-holder img').attr('src', url);
                    $('#crop-preview-' + options.mode).attr('src', url);

                    $('#image-crop-' + options.mode).Jcrop({
                        bgColor: '#fff',
                        onChange: showPreview,
                        onSelect: showPreview,
                        aspectRatio: 0.83333333333333
                    }, function(){
                        jcropApi = this;
                    });

                    cancelCropBtn.bind('click', function(){
                        $('.modal.hide.fade.' + options.mode).modal('hide');
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
                            'w':        coords.w,
                            'h':        coords.h,
                            'assetKey': assetKey
                        };

                        var scope = config.scope;

                        $http.post('/gc/api/profiles/images/crop/', data).success(
                            function(data, status, headers, config){
                                var uri = data.response.uri;
                                uri = uri.replace(/http:/, '');
                                scope.thumbnailURI = uri;
                                $('#drop-target-' + options.mode).attr('src', uri);
                            }
                        );

                        $('.modal.hide.fade.' + options.mode).modal('hide');
                    });

                    function showPreview(coords){
                        var rx = 250 / coords.w;
                        var ry = 300 / coords.h;

                        $('#crop-preview-' + options.mode).css({
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
    }])
    .directive('emailValidator', ['$http', function($http){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl){
                /*
                    Zocia responds with a 404 when we can't find a user by email, so
                    we're interested in a 404 response from the server to indicate
                    an email not associated with an account
                */
                ctrl.$parsers.unshift(function(viewValue){
                    $http.get('api/profiles/asyncEmail/' + viewValue).success(function(data){
                        if(data.status === 404){
                            ctrl.$setValidity('emailValidator', true);
                            return viewValue;
                        }else{
                            ctrl.$setValidity('emailValidator', false);
                            return undefined;
                        }
                    });
                });

                elm.bind('focus', function(){
                    if(ctrl.$invalid && ctrl.$dirty){
                        $('#'+attrs.id).tooltip('hide');
                    }
                });

                elm.bind('blur', function(event){
                    if(ctrl.$invalid && (ctrl.$modelValue !== '' && ctrl.$viewValue !== undefined)){
                        $('#'+attrs.id).tooltip({
                            trigger: 'manual',
                            placement: 'right',
                            title: 'This email address is already in use'
                        });

                        $('#'+attrs.id).tooltip('show');
                    }
                });
            }
        }
    }])
    .directive('usernameValidator', ['$http', function($http){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl){
                /*
                 Zocia responds with a 404 when we can't find a user by username, so
                 we're interested in a 404 response from the server to indicate
                 an username not associated with an account
                 */
                ctrl.$parsers.unshift(function(viewValue){
                    $http.get('api/profiles/asyncUsername/' + viewValue).success(function(data){
                        if(data.status === 404){
                            ctrl.$setValidity('usernameValidator', true);
                            return viewValue;
                        }else{
                            ctrl.$setValidity('usernameValidator', false);
                            return undefined;
                        }
                    });
                });

                elm.bind('focus', function(){
                    if(ctrl.$invalid && ctrl.$dirty){
                        $('#'+attrs.id).tooltip('hide');
                    }
                });

                elm.bind('blur', function(event){
                    if(ctrl.$invalid && (ctrl.$viewValue !== '')){
                        $('#'+attrs.id).tooltip({
                            trigger: 'manual',
                            placement: 'right',
                            title: 'This username is already in use'
                        });

                        $('#'+attrs.id).tooltip('show');
                    }
                });
            }
        }
    }])
    .directive('validationTooltip', function(){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl){
                var controller = ctrl;

                $('#'+attrs.id).tooltip({
                    trigger: 'manual',
                    placement: 'right',
                    title: function(){
                        return getValidationErrorMessage(attrs, controller.$error);
                    }
                });

                elm.bind('blur', function(event){
                    if(!controller.$valid){
                        return scope.$apply(function(){
                            $('#'+attrs.id).tooltip('show');
                            controller.$viewValue;
                        });
                    }
                });

                elm.bind('focus', function(event){
                    return scope.$apply(function(){
                        $('#'+attrs.id).tooltip('hide');
                        controller.$viewValue;
                    });
                });

                function getValidationErrorMessage(attrs, error){
                    if(error.required && (controller.$viewValue === undefined || controller.$viewValue !== '')){
                        return 'This is a required field';
                    }
                    if(error.minlength){
                        return 'This field requires a minimum of ' + attrs.ngMinlength + ' characters';
                    }
                    if(error.maxlength){
                        return 'This field requires a maximum of ' + attrs.ngMaxlength + ' characters';
                    }
                    if(error.usernameValidator){
                        return 'This username is already in use';
                    }
                }
            }
        }
    });
