'use strict';

/* Directives */


angular.module( 'bgc.directives', [] )
    .directive('thumbnail', function(){
        return{
            restrict: 'E',
            templateUrl: 'partials/thumbnail-template.html',

            link: function(scope, elm, attr){
                scope.thumbnail = {
                    image: 'url of generic profile image',
                    text: '',
                    url: '',
                    type: 'profile-thumbnail large',
                    showAnchor: false
                }

                if(attr.type === 'profile'){
                    if(attr.image){
                        scope.thumbnail.image = attr.image;
                    }
                    scope.thumbnail.url = '';
                    scope.thumbnail.text = '';
                    scope.thumbnail.type = 'profile-thumbnail';
                }

                if(attr.type === 'article'){
                    if(attr.image){
                        scope.thumbnail.image = attr.image;
                    }else{
                        scope.thumbnail.image = 'url of generic article image';
                    }
                    scope.thumbnail.text = 'Read More';
                    scope.thumbnail.url = '#/content';
                    scope.thumbnail.type = 'article-thumbnail';
                    scope.thumbnail.showAnchor = true;
                }
            }
        }
    })
    .directive('readMoreHover', function(){
        return{
            restrict: 'A',
            link: function(scope, elm, attr){
                jQuery('.read-more').hover(
                    function(){
                        $(this).stop().animate({
                            left: '0'
                        }, 200)
                    },
                    function(){
                        $(this).stop().animate({
                            left: '-88px'
                        }, 200)
                    }
                );
            }
        }
    })
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
                    browse_button: 'choose-files',
                    container:'container',
                    url: '/gc/api/profiles/images/upload/',
                    max_file_size:'100mb',
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
                        $$('filelist').innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
                    }

                    setTimeout(function () {
                        uploader.start();
                    }, 500);
                });

                uploader.bind('BeforeUpload', function(upload, file){
                    upload.settings.multipart_params = {size: file.size}
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
    }])
    .directive('emailValidator', ['$http', function($http){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl){
                var message = 'An email address is required';
                var valid = false;

                function setErrorMessage(message){
                    return message;
                }
                /*
                    Zocia responds with a 404 when we can't find a user by email, so
                    we're interested in a 404 response from the server to indicate
                    an email not associated with an account
                */
                ctrl.$parsers.push(function(value){
                    if(scope.master && scope.master.accountEmail.address === value){
                        ctrl.$setValidity('emailValidator', true);
                        return value;
                    }

                    if(value !== undefined){
                        if((value.length > 2 && value.length < 17) || value.length === ''){
                            $http.get('api/profiles/byprimaryemail/' + value).success(function(data){
                                if(data.status === 404){
                                    valid = true;
                                }else{
                                    ctrl.$setValidity('emailValidator', false);
                                    message = 'This email address is already in use.'
                                    return undefined;
                                }
                            });

                            if(valid){
                                ctrl.$setValidity('emailValidator', true);
                                return value;
                            }
                        }else{
                            ctrl.$setValidity('emailValidator', false);
                            if(value.length < 3){
                                message = 'Your email address must be at least 3 characters';
                            }else if(value.length > 16){
                                message = 'Your email address cannot be more than 16 characters';
                            }else{
                                message = 'An email address is required';
                            }
                        }
                    }else{
                        message = 'Your email address has an invalid format'
                    }
                });

                jQuery('#'+attrs.id).tooltip({
                    trigger: 'manual',
                    placement: 'right',
                    title: function(){
                        return setErrorMessage(message);
                    }
                });

                elm.bind('blur', function(event){
                    if(ctrl.$invalid || ctrl.$viewValue === undefined){
                        jQuery('#'+attrs.id).tooltip('show');
                    }
                });

                elm.bind('focus', function(event){
                    return scope.$apply(function(){
                        jQuery('#'+attrs.id).tooltip('hide');
                    });
                });

                scope.$on('$routeChangeStart', function(){
                    jQuery('.tooltip').remove();
                });
            }
        }
    }])
    .directive('usernameValidator', ['$http', '$timeout', function($http, $timeout){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl){
                var message = 'Username is required';
                var valid = false;

                function setErrorMessage(message){
                    return message;
                }
                /*
                 Zocia responds with a 404 when we can't find a user by username, so
                 we're interested in a 404 response from the server to indicate
                 a username not associated with an account
                 */
                ctrl.$parsers.push(function(value){
                    if(scope.master && scope.master.username === value){
                        ctrl.$setValidity('usernameValidator', true);
                        return value;
                    }
                    if((value.length > 2 && value.length < 17) || value.length === ''){
                        $http.get('api/profiles/byusername/' + value).success(function(data){
                            if(data.status === 404){
                                valid = true;
                            }else{
                                ctrl.$setValidity('usernameValidator', false);
                                message = 'This username is already in use.'
                            }
                        });

                        if(valid){
                            ctrl.$setValidity('usernameValidator', true);
                            return value;
                        }
                    }else{
                        if(value.length < 3){
                            message = 'Username must be at least 3 characters';
                        }else if(value.length > 16){
                            message = 'Username cannot be more than 16 characters';
                        }else{
                            message = 'Username is required';
                        }

                        ctrl.$setValidity('usernameValidator', false);
                    }
                });

                jQuery('#'+attrs.id).tooltip({
                    trigger: 'manual',
                    placement: 'right',
                    title: function(){
                        return setErrorMessage(message);
                    }
                });

                elm.bind('blur', function(event){
                    if(ctrl.$invalid || ctrl.$viewValue === undefined){
                        jQuery('#'+attrs.id).tooltip('show');
                    }
                });

                elm.bind('focus', function(event){
                    return scope.$apply(function(){
                        jQuery('#'+attrs.id).tooltip('hide');
                    });
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
                        return setErrorMessage(attrs, controller.$error);
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

                function setErrorMessage(attrs, error){
                    if(error.required){
                        return 'This is a required field';
                    }
                    if(error.minlength){
                        return 'This field requires a minimum of ' + attrs.ngMinlength + ' characters';
                    }
                    if(error.maxlength){
                        return 'This field requires a maximum of ' + attrs.ngMaxlength + ' characters';
                    }
                }
            }
        }
    });

/**
 * @ngdoc directive
 * @name bgc.directives:cms
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
angular.module('bgc.directives').directive('cms', ['$http',
    function ($http) {
        return {
            // Is applied as an element's attribute
            restrict: 'A',
            // Current content will be replaced
            replace: true,
            link: function (scope, element, attrs) {
//                element.html('Hello');
//                element.addClass('cms-missing');
//                return;
                // Read the initial content of the element, and if none exists add something
                var initialContent = element.html() || 'CMS Problem';
                // Wipe out any existing content
                element.html('');
                // The cms property contains the lookup key
                var key = attrs.cms;
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
                                element.html(data[0].content);
                            } else {
                                // If no content was found, put the original content back in place
                                element.html(initialContent);
                                // And set a CSS class @todo: How pervasive is addClass()?
                                element.addClass('cms-missing');
                            }
                        })
                        .error(function (data, status, headers, config) {
                            // In case of an error, add in the initial content and the status code of error
                            element.html(initialContent + '<span> (' + status + ')</span>');
                            // And set a CSS class to indicate the error.
                            element[0].addClass('cms-error');
                        });
            }
        }
    }
]);
