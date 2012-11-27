'use strict';

//adding these to allow support for IE8
if ( !Array.prototype.forEach ) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope, this[i], i, this);
        }
    }
}

if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisp */)
    {
        "use strict";

        if (this == null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in t)
            {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

/* Directives */

/**
 * @ngdoc directive
 * @name bgc.directives:thumbnail
 *
 * @description
 * The 'thumbnail' directive generates markup for three different types of thumbnails in
 * the Babson GCEE app. The three different types of thumbnails are profile, content, and
 * article, with the directive defaulting to generate a large profile thumbnail with generic
 * artwork in place of an image if a user does not specify any parameters.
 *
 * @element ELEMENT
 * @param {String}  type            Will accept "profile", "article" or "content"
 * @param {String}  size            Will accept "large", "med", or "small". Used with profile type
 * @param {String}  rotation        Will accept "clockwise", "counter-clockwise" or "none" Used with profile type
 * @param {String}  text            Text to display in the hyperlink. Used with article and content types
 * @param {String}  url             The url of the link to navigate to. Used with article and content types
 * @param {String}  image           The url of the image to be used for the thumbnail.
 * @param {String} facultyFellow    Does not need a value. If present will display a small globe in the upper right
 *                                  corner of a profile thumbnail. Used with profile type
 *
 * If no parameters are given, the directive will generate a profile thumbnail with a generic
 * image that's 135px square rotated 10 degrees clockwise. Some parameters will be ignored
 * depending on the type of thumbnail you intend to generate. For example, if you want to generate
 * a profile thumbnail and include text and url attributes, they will be ignored since a profile
 * thumbnail does not use any of those attributes. If you list a size attribute for an article
 * thumbnail it will be ignored because article thumbnails have one size.
 *
 * @example
 <example>
 <thumbnail />

 <thumbnail
    type="profile"
    size="large"
    rotation="clockwise"
    image="rosie.jpg"
    facultyFellow="true" />

 <thumbnail
    type="article"
    text="Read Less"
    url="#/content/"
    image="images/homepage-article-image-one.jpg" />
 </example>
  */
angular.module( 'bgc.directives', [] );

angular.module( 'bgc.directives')
    .directive('thumbnail', function(){

        return{
            restrict: 'A',
            templateUrl: 'partials/thumbnail-template.html',
            scope: {
                auth: '=',
                thumb: '='
            },
            link: function(scope, elm, attr){
                scope.defaultImage = 'images/GCEE_image_defaultMale.jpeg';

                scope.thumbnail = {
                    //image: 'images/GCEE_image_profileFemale_135x135.jpeg',
                    text: 'Read More',
                    style: 'profile-thumbnail large counter-clockwise'
                }

                scope.togglePortrait = function(){
                    if(scope.defaultImage === 'images/GCEE_image_defaultMale.jpeg'){
                        scope.defaultImage = 'images/GCEE_image_defaultFemale.jpeg';
                    }else if(scope.defaultImage === 'images/GCEE_image_defaultFemale.jpeg'){
                        scope.defaultImage = 'images/GCEE_image_defaultMale.jpeg';
                    }

                    scope.$emit('togglePortrait');
                }

                if(attr.type === 'profile' || !attr.type){
                    scope.thumbnail.type = attr.type;

                    if(attr.size && attr.rotation){
                        scope.thumbnail.style = 'profile-thumbnail ' + attr.size + ' ' + attr.rotation;
                        return;
                    }

                    if(attr.size){
                        scope.thumbnail.style = 'profile-thumbnail ' + attr.size + ' counter-clockwise';
                        return;
                    }

                    if(attr.rotation){
                        scope.thumbnail.style = 'profile-thumbnail large ' + attr.rotation;
                        return;
                    }

                    return;
                }

                if(attr.type === 'article' || attr.type === 'content'){
                    scope.thumbnail.type = 'content';
                    scope.thumbnail.style = 'content-thumbnail no-rotation';

                    if(attr.type === 'article'){
                        scope.thumbnail.type = 'article';
                        scope.thumbnail.style = 'article-thumbnail no-rotation';
                    }

                    if(attr.text){
                        scope.thumbnail.text = attr.text;
                    }

                    return;
                }
            }
        }
    });

/**
 * @ngdoc directive
 * @name bgc.directives:readMoreHover
 *
 * @description Makes the "Read More" and "Preview" links pop out on mouseover.
 *
 * @element Attribute
 *
 * @example <div read-more-hover>
 <p>Read More</p>
 <div class="read-more-arrow"></div>
 </div>
 */
angular.module('bgc.directives')
    .directive('readMoreHover', function(){
        
        return{
            restrict: 'A',
            link: function(scope, elm, attr){
                jQuery(elm).hover(
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
    });

/**
 * @ngdoc directive
 * @name bgc.directives:docViewer
 *
 * @description Creates an iframe that contains an embedded GoogleDoc
 *
 * @element Element
 * @param {boolean} googleDoc
 * {string} url A URL where the document can be found. Can either be an actual GoogleDoc URL, or can simply be http://example.com/document.doc. The directive assumes the latter
 *
 * @example  <doc-viewer url="http://example.com/document.doc"></doc-viewer>
 */
angular.module('bgc.directives')
    .directive('docViewer', function (){
        
        return{
            restrict:'E',
            template: '<iframe src="" style="margin: 2em 0 0 2em; width:100%; height:700px;" frameborder="3px"></iframe>',

            compile: function(element, attrs){
                var isGoogleDoc = false;

                if(attrs.googleDoc){
                    isGoogleDoc = (attrs.googleDoc == 'true') ? true : false;
                }

                if(isGoogleDoc){
                    element[0].firstChild.src = attrs.url;
                }else{
                    element[0].firstChild.src = 'http://docs.google.com/viewer?url=' + attrs.url + '&embedded=true';
                }
            }
        }
    });

/**
 * @ngdoc directive
 * @name bgc.directives:passwordValidator
 *
 * @description
 *
 * @element
 * @param
 *
 * @example
 */
angular.module('bgc.directives')
    .directive('passwordValidator', function(){
        
        return{
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attr, ctrl) {
                var pwdWidget = elm.inheritedData('$formController')[attr.passwordValidator];
                jQuery('#'+attr.id).tooltip({
                    trigger: 'manual',
                    placement: 'right',
                    title: 'Your passwords do not match'
                });

                ctrl.$parsers.push(function(value) {
                    if (value === pwdWidget.$viewValue) {
                        ctrl.$setValidity('MATCH', true);
                        return value;
                    }
                    jQuery('#'+attr.id).tooltip('hide');
                    ctrl.$setValidity('MATCH', false);
                });

                pwdWidget.$parsers.push(function(value) {
                    ctrl.$setValidity('MATCH', value === ctrl.$viewValue);
                    return value;
                });

                elm.bind('blur', function(event){
                    if(ctrl.$invalid){
                        jQuery('#'+attr.id).tooltip('show');
                    }
                });

                elm.bind('focus', function(event){
                    return scope.$apply(function(){
                        jQuery('#'+attr.id).tooltip('hide');
                    });
                });

                scope.$on('cancelEdit', function(){
                    jQuery('.tooltip').remove();
                });
            }
        };
    });

/**
 * @ngdoc directive
 * @name bgc.directives:profileUpload
 *
 * @description
 *
 * @element
 * @param
 *
 * @example
 */
angular.module('bgc.directives')
    .directive('pyklUpload', ['$http', function($http){
        
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
                    url: 'api/profiles/images/upload/',
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
                    var content = scope.$eval("(" + response.response + ")");

                    content = scope.$eval("(" + content.content + ")");
                    url = content.uri;
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

                        $http.post('api/profiles/images/crop/', data).success(
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

angular.module('bgc.directives')
    .directive('pyklProfileImageUpload', ['$http', function($http){

    //alert('Upload Directive!');

    //pyklConfig.upload = pyklConfig.upload || {};

    return{
        restrict: 'A',
        link:function (scope, elm, attrs) {
            var options = {};
            var cancelCropBtn;
            var saveCropBtn;

            cancelCropBtn = angular.element('#cancel-crop');
            saveCropBtn = angular.element('#save-crop');

            options = scope.$eval(attrs.pyklProfileImageUpload);

            var config = {
                scope: scope,
                runtimes: 'html5',
                browse_button: 'choose-files',
                //container:'container',
                url: 'api/profiles/images/upload/',
                max_file_size:'100mb',
                resize:{width:'100%', quality:90},
                flash_swf_url:'../js/plupload.flash.swf',
                silverlight_xap_url:'../js/plupload.silverlight.xap',
                filters:[
                    {title:"Image files", extensions:"jpg,gif,png,jpeg"},
                    {title:"Zip files", extensions:"zip"}
                ]
            };

            if (attrs.pyklProfileImageUpload) {
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
                $('.jcrop-holder').empty();
                var progress = '<div class="upload-progress clearfix"><div id="block-1" class="little-block"></div> \
                                       <div id="block-2" class="little-block"></div> \
                                       <div id="block-3" class="little-block"></div> \
                                       <div id="block-4" class="little-block"></div> \
                                       <div id="block-5" class="little-block"></div> \
                                       <div id="block-6" class="little-block"></div> \
                                       <div id="block-7" class="little-block"></div> \
                                       <div id="block-8" class="little-block"></div> \
                                       <div id="block-9" class="little-block"></div></div>'

                jQuery('.info.image h3').after(progress);

                $('.jcrop-holder').append('<img id="image-crop" src="" alt="">');

                setTimeout(function () {
                    uploader.start();
                }, 500);
            });

            uploader.bind('BeforeUpload', function(upload, file){
                upload.settings.multipart_params = {size: file.size}
            });


            /*uploader.bind('UploadProgress', function (up, file) {
                $$(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            });*/

            var url;

            uploader.bind('FileUploaded', function(uploader, file, response){
                var content = scope.$eval("(" + response.response + ")");
                content = scope.$eval("(" + content.content + ")");

                url = content.uri;
            });

            var jcropApi;
            //var height;
            //var width;

            cancelCropBtn.bind('click', function(){
                $('.upload-progress').remove();
                $('.jcrop-holder').empty();
                $('.profile-crop-preview').hide();
                //jcropApi.destroy();
                console.log('Files in queue: ' + uploader.files.length)
            });

            saveCropBtn.bind('click', function(){
                var progress = '<div class="upload-progress clearfix"><div id="block-1" class="little-block"></div> \
                                       <div id="block-2" class="little-block"></div> \
                                       <div id="block-3" class="little-block"></div> \
                                       <div id="block-4" class="little-block"></div> \
                                       <div id="block-5" class="little-block"></div> \
                                       <div id="block-6" class="little-block"></div> \
                                       <div id="block-7" class="little-block"></div> \
                                       <div id="block-8" class="little-block"></div> \
                                       <div id="block-9" class="little-block"></div></div>'

                jQuery('.info.image h3').after(progress);

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
                var profile = scope.$parent.profile;

                $http.post('api/profiles/images/crop/', data).success(
                    function(data, status, headers, config){
                        $('.upload-progress').remove();
                        var uri = data.content.uri;
                        uri = uri.replace(/http:/, '');

                        delete profile.isUserFollowing;
                        delete profile.facultyFellow;

                        profile.thumbnail = uri;
                        scope.$parent.updateThumbnailUri(profile);
                        //scope.$digest();
                        //$('.new-picture-frame.profile-thumbnail img').attr('src', uri);
                    }).error(
                    function(){
                        console.log('Image crop error!');
                    }
                );

                //height = $('#image-crop').height();
                //width = $('#image-crop').width();

                $('.profile-crop-preview').hide();
            });

            uploader.bind('UploadComplete', function(uploader, file){
                //$('#image-crop').attr('src', url);
                $('.upload-progress').remove();
                $('.profile-crop-preview').show();

                $('.jcrop-holder img').attr('src', url);

                $('#image-crop').attr('src', url);

                //$('#crop-preview').attr('src', url);

                $('#image-crop').Jcrop({
                    bgColor: '#fff',
                    //onChange: showPreview,
                    //onSelect: showPreview,
                    aspectRatio: 1
                }, function(){
                    jcropApi = this;
                });

                /*function showPreview(coords){
                    var rx = 135 / coords.w;
                    var ry = 135 / coords.h;

                    $('#crop-preview').css({
                        width: Math.round(rx * width) + 'px',
                        height: Math.round(ry * height) + 'px',
                        marginLeft: '-' + Math.round(rx * coords.x) + 'px',
                        marginTop: '-' + Math.round(ry * coords.y) + 'px'
                    });
                }*/
            });

            uploader.init();
        }
    }
}])

/**
 * @ngdoc directive
 * @name bgc.directives:emailValidator
 *
 * @description
 *
 * @element
 * @param
 *
 * @example
 */
angular.module('bgc.directives')
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
                        if((value.length > 2 && value.length < 32) || value.length === ''){
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
                            }else if(value.length > 31){
                                message = 'Your email address cannot be more than 32 characters';
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

                scope.$on('cancelEdit', function(){
                    jQuery('.tooltip').remove();
                });
            }
        }
    }]);

/**
 * @ngdoc directive
 * @name bgc.directives:usernameValidator
 *
 * @description
 *
 * @element
 * @param
 *
 * @example
 */
angular.module('bgc.directives')
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

                scope.$on('cancelEdit', function(){
                    jQuery('.tooltip').remove();
                });
            }
        }
    }]);

/**
 * @ngdoc directive
 * @name bgc.directives:validationTooltip
 *
 * @description
 *
 * @element
 * @param
 *
 * @example
 */
angular.module('bgc.directives')
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
                    if(error.pattern &&
                        (attrs.id === "institution-year-started" || attrs.id === "education-year-started"
                            || attrs.id === "institution-year-finished" ||  attrs.id === "education-year-finished")
                        ){
                        return 'This field will only accept year values between 1900 - 2100';
                    }
                }
            }
        }
    });

/**
 * Converts a link into a dropdown menu.
 *
 * @example <div class="dropdown" ng-dropdown>
 *               <a data-toggle="dropdown" class="thumb">LINK TEXT</a>
 *               <ul class="dropdown-menu">
 *                   <li>ITEM 1</li>
 *                   <li>ITEM 2</li>
 *               </ul>
 *          </div>
 */
angular.module('bgc.directives')
    .directive('dropdown', function(){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm){
                elm.dropdown();
            }
        }
    });

/**
 * @ngdoc directive
 * @name bgc.directives:stream-item
 *
 * @description
 *
 *
 * @element ELEMENT
 * @param {String}  type            Will accept "profile", "article" or "content"
 * @param {String}  size            Will accept "large", "med", or "small". Used with profile type                                  corner of a profile thumbnail. Used with profile type
 *
 * If no parameters are given, the directive will generate a profile thumbnail with a generic
 * image that's 135px square rotated 10 degrees clockwise. Some parameters will be ignored
 * depending on the type of thumbnail you intend to generate. For example, if you want to generate
 * a profile thumbnail and include text and url attributes, they will be ignored since a profile
 * thumbnail does not use any of those attributes. If you list a size attribute for an article
 * thumbnail it will be ignored because article thumbnails have one size.
 *
 * @example

 */
angular.module('bgc.directives').directive('streamItem', ['$http',
    function($http){
        return{
            restrict: 'A',
            replace: true,
            scope: {
                item: '=',
                auth: '=',
                thumbsize: '='
            },
            //transclude: 'element',
            templateUrl: 'partials/activityStreamItem.html',
            link: function(scope, elm, attrs){
                scope.thumbsize = attrs.thumbsize || "small";
                //console.log(attrs.ngModel);
            }
        }
    }
]);

/**
 * Adds a twitter bootstrap tab for all direct child elements.
 *
 * @param [options] {mixed} Can be an object with multiple options, or a string with the animation class
 *    class {string} the CSS class(es) to use. For example, 'ui-hide' might be an excellent alternative class.
 *
 *    Additionally, it's possible to pass in "sortBy: {string}, sortFunction: {function}" as arguments to the tab, which will cause the tab to call the sortFunction instead of simply changing content.
 *    This is mostly used for Most Recent and Most Popular tabs, where the content views would be exactly the same.
 *
 * @example <li ui-tabs="{tab1:{label:'This is the first tab'}, tab2:{label: 'this is the second tab'}}">
 * <div>content of tab1</div>
 * <div>content of tab2</div>
 * </li>
 */
//todo: DELETE ME
angular.module('bgc.directives').directive('uiTabs', ['$compile', function ($compile) {

    'use strict';

    var getTabDefinitions = function (scope, attrs) {
        var tabs = scope.$eval(attrs.uiTabs);

        if (!tabs)
            throw new Error("The ui-tabs directive requires an initialization object in the form of ui-tabs=\"{ tab1 : {label:'label text 1'}, tab2: {label:'label text 1'} }\". Did you forget to set the attributes value?");

        return tabs;
    };

    return {
        link: function (scope, element, attrs, controller) {

            var tabs = getTabDefinitions(scope, attrs);
            var children = $('> *', element);

            var html = "";
            var tabArray = [];
            var index = 0;
            var currentTab = null;
            $.each(tabs, function (prop, tab) {
                tab.activate = function () {
                    var _this = this;
                    $.each(tabs, function (p, val) {
                        if (val.active = (val === _this)) {
                            currentTab = val;
                            if(currentTab.sortBy) {
                                currentTab.sortFunction(currentTab.sortBy);
                            } else {
                                val.element.show();
                            }
                        }
                        else {
                            if(!currentTab.sortBy) {
                                val.element.hide();
                            }
                        }
                    });
                };
                tabArray.push(prop);
                tab.element = $(children[index++]);
                html += "<li ng-class='{active:tabs." + prop + ".active}'><a ng-click='tabs." + prop + ".activate()'>{{tabs." + prop + ".label}}</a></li>";
            });

            if (tabArray.length !== children.length) throw new Error("The uiTabs attribute declared " + tabArray.length + " tabs, but contains " + children.length + " child elements.");
            var activeCount = $.grep(tabArray, function (v) { return tabs[v].active; }).length;

            if (activeCount > 1) {
                throw new Error('Can only activate one tab at a time. Tab definitions indicate ' + activeCount + ' active tabs.');
            }
            else if (activeCount === 1){
                tabs[$.grep(tabArray, function (v) { return tabs[v].active; })[0]].activate();
            }
            else {
                $.each(tabArray, function (i, v) {
                    if (i === 0) tabs[v].activate();
                });
            }

            scope.tabs = tabs;
            element.prepend($compile("<ul class='nav nav-tabs'>" + html + "</ul>")(scope));
        }
    };
}]);

angular.module('bgc.directives').directive('discussionStack', ['$compile', function($compile){
    'use strict';
    return {
        link: function(scope, element, attrs){
            var top = 4;
            var left = 5;
            var zIndex = -1;
            var height = element.height() - element.css('margin-bottom').replace('px', '');
            //var height = element.height();
            height -= 21;

            attrs.$observe('comments', function(value){
                var stacks = Math.floor(value/5);

                for(var i=0; i < stacks; i++){
                    var div = document.createElement('div');
                    div = jQuery(div);
                    div.addClass('discussion-item discussion-stack-div grey-gradient');
                    div.css({
                        'width': element.css('width'),
                        'height': height,
                        'top': top,
                        'left': left,
                        'z-index': zIndex
                    });

                    element.parent('.discussion-stack-container').append($compile(div)(scope));

                    top += 4;
                    left += 4;
                    zIndex -= 1;
                }
            });
        }
    }
}]);

/**
 * Reloads the twitter buttons. Without this, twitter buttons show up as unstyled "Tweet" links, which are boring and ugly.
 *
 * @example <div class="article-tweet-button" reload-twitter-btns>
             <a href="https://twitter.com/share" class="twitter-share-button" data-lang="en">Tweet</a>
            </div>
 */
angular.module('bgc.directives').directive('reloadTwitterBtns', function(){
    'use strict'

    return {
        compile: function compile() {
            return {
                post: function(){
                    if(twttr !== undefined) {
                        twttr.widgets.load();
                    }
                }
            }
        }
    }
});

/**
 * Runs a function when the user reaches the bottom of the page. The individual function that is run is passed in as an argument.
 *
 * @param [options] {function} This should be a function that is passed into the directive. The function would then load more objects and add them to the list
 * @example <div when-scrolled="loadMore()">
 */
angular.module('bgc.directives').directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        var raw = elm[0];
        var offset = attr.offset || 0;
        angular.element(window).bind('scroll', function() {
            var rectObject = raw.getBoundingClientRect();
            //229 is the value of the footer height and some other things. it's possible this might need to be an option passed in though
            if (Math.floor(rectObject.bottom) === $(window).height() - 150 - offset) {
                scope.$apply(attr.whenScrolled);
            }

        });
    };
});

angular.module('bgc.directives').directive('secondaryNav', ['$compile', function($compile){
    return {
        link: function(scope, element, attr){
            element.bind('click', function(){
                element.children('a').addClass('active-secondary');
                $compile(element)(scope);
            });
        }
    }
}]);

/**
 * Used for liking, and unliking and object
 *
 * @param [id] {string} The ID of the object to be liked
 * @example <like id="{{id}}"></like>
 */
angular.module('bgc.directives').directive('like', ['$http', '$rootScope', function($http, $rootScope){
    return {
        restrict: 'E',
        template: '<a ng-click="like()"><i class="likes"></i> {{likeText}}</a>',
        replace: true,
        link: function(scope, elm, attrs){
            scope.likeText = "Like This";
            scope.alreadyLiked = true;

            attrs.$observe('objectid', function(object_id) {
                if(object_id !== '') {
                    $http.get("api/utility/like/" + object_id).success(function(data) {
                        var result = JSON.parse(data);
                        if(result) {
                            scope.likeText = "Unlike";
                        }
                        scope.alreadyLiked = result;
                    });
                }
            });

            scope.like = function() {
                if(!$rootScope.auth.isAuthenticated) {
                    return;
                }
                if(scope.alreadyLiked) {
                    $http.post("api/utility/unlike/" + attrs.objectid).success(function(data) {
                        scope.likeText = "Like This";
                        scope.alreadyLiked = false;
                        if(scope.increaseLikes !== undefined) {
                            scope.increaseLikes(data.likes);
                        }
                    });
                } else {
                    $http.post("api/utility/like/" + attrs.objectid).success(function(data) {
                        scope.likeText = "Unlike";
                        scope.alreadyLiked = true;
                        if(scope.increaseLikes !== undefined) {
                            scope.increaseLikes(data.likes);
                        }
                    });
                }
            }
        }
    }
}]);

/**
 * Used for marking an object (mostly a discussion) as spam
 *
 * @param [id] {string} The ID of the object to be marked as spam
 * @example <like id="{{id}}"></like>
 */
angular.module('bgc.directives').directive('spam', ['$http', '$rootScope', function($http, $rootScope){
    return {
        restrict: 'E',
        template: '<a ng-click="markAsSpam()"><i class="flag"></i> {{spamText}}</a>',
        replace: true,
        link: function(scope, elm, attrs){
            scope.spamText = "Flag for Spam";
            scope.alreadyMarked = true;

            attrs.$observe('objectid', function(object_id) {
                if(object_id !== '') {
                    $http.get("api/utility/spam/" + object_id).success(function(data) {
                        var result = JSON.parse(data);
                        if(result) {
                            scope.spamText = "Remove Spam Flag";
                            if(scope.hidePost !== undefined) {
                                scope.hidePost(object_id);
                            }
                        }
                        scope.alreadyMarked = result;
                    });
                }
            });

            scope.markAsSpam = function() {
                if(!$rootScope.auth.isAuthenticated) {
                    return;
                }
                if(scope.alreadyMarked) {
                    $http.post("api/utility/unspam/" + attrs.objectid).success(function(data) {
                        scope.spamText = "Flag for Spam";
                        scope.alreadyMarked = false;
                        if(scope.hidePost !== undefined) {
                            scope.hidePost(attrs.objectid, "dec");
                        }
                    });
                } else {
                    $http.post("api/utility/spam/" + attrs.objectid).success(function(data) {
                        scope.spamText = "Remove Spam Flag";
                        scope.alreadyMarked = true;
                        if(scope.hidePost !== undefined) {
                            scope.hidePost(attrs.objectid, "inc");
                        }
                    });
                }
            }
        }
    }
}]);

angular.module('bgc.directives').directive('adminDeleteUser', ['Profile', function(Profile){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var attrs = attrs;
            var check = false;
            elm.bind('click', function(){
                if(!check) {
                    elm.html('<i class="icon-question-sign icon-white"></i> Are You Sure?');
                    check = true;
                    return;
                }
                //var userId = attrs.userid
                var profile = Profile['delete']({"profileId": attrs.userid}, function(){
                    elm.parents('.profile-list-item.profile').fadeOut('slow', function(){
                        $(this).remove();
                    });
                });
            });
        }
    }
}]);

angular.module('bgc.directives').directive('adminDeactivateUser', ['Profile', function(Profile){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var attrs = attrs;
            var check = false;
            elm.bind('click', function(){
                if(!check) {
                    elm.html('<i class="icon-question-sign icon-white"></i> Are You Sure?');
                    check = true;
                    return;
                }

                var user = JSON.parse(attrs.user);
                user.status = "unverified";

                //var userId = attrs.userid
                var profile = Profile.update({profileId:user._id}, user, function(){
                    elm.parents('.btn-group-border').removeClass('btn-group-border').html("<p>This user is now deactivated</p>");
                });
            });
        }
    }
}]);

angular.module('bgc.directives').directive('adminDeleteArticle', ['Article', function(Article){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var attrs = attrs;
            var check = false;
            elm.bind('click', function(){
                if(!check) {
                    elm.html('<i class="icon-question-sign icon-white"></i> Are You Sure?');
                    check = true;
                    return;
                }
                //var articleId = attrs.articleid
                var profile = Article['delete']({ "articleId": attrs.articleid}, function(){
                    elm.parents('.article.admin.row').fadeOut('slow', function(){
                        $(this).remove();
                    });
                });

            });
        }
    }
}]);

angular.module('bgc.directives').directive('adminResetPassword', ['$http', function($http){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var attrs = attrs;
            var check = false;
            elm.bind('click', function(){
                if(!check) {
                    elm.html('<i class="icon-question-sign icon-white"></i> Are You Sure?');
                    check = true;
                    return;
                }
                var data = {
                    profileEmail: attrs.email
                };

                $http.post('api/utility/resettoken/', data)
                    .success(function(data, status, headers, config){
                        if(data.success) {
                            elm.parents('.btn-group-border').fadeOut('fast', function(){
                                var controlsElement = elm.parents('.controls');
                                $(this).remove();
                                controlsElement.append("<h3>We've sent an email to this user with instructions on how to complete the password reset process</h3>");
                            });
                        } else {
                            //$scope.showError = true;
                        }
                    });
            });
        }
    }
}]);

angular.module('bgc.directives').directive('pyklFileAttachment', ['$http', '$auth', function($http, $auth){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var config = {
                scope: scope,
                runtimes: 'html5',
                browse_button: 'choose-files',
                container:'container',
                url: 'api/profiles/images/upload/',
                max_file_size:'100mb',
                resize:{width:320, height:240, quality:90},
                //flash_swf_url:'../js/plupload.flash.swf',
                //silverlight_xap_url:'../js/plupload.silverlight.xap',
                filters:[
                    {title : "Image files", extensions : "pdf,doc,ppt,txt,jpg,jpeg"},
                    {title:"Zip files", extensions:"zip"}
                ]
            };

            function $$(id) {
                return document.getElementById(id);
            }

            var uploader = new plupload.Uploader(config);

            uploader.bind('FilesAdded', function (up, files) {
                var scope = config.scope;

                var attachment = {
                    title: '',
                    description: '',
                    file_id: ''
                };

                for (var i in files) {
                    attachment.file_id = files[i].id;
                    scope.attachments.push(attachment);
                    scope.$apply();
                    //$$('filelist').innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
                    var attachmentFields = jQuery('.attachment-fields').last();
                    attachmentFields.children('.filename').children('.control-group').children('.controls').html(files[i].name + ' (' + plupload.formatSize(files[i].size) + ')');
                }

                /*setTimeout(function () {
                    uploader.start();
                }, 500);*/
            });

            uploader.bind('BeforeUpload', function(upload, file){
                upload.settings.multipart_params = {size: file.size}
            });

            uploader.bind('FilesRemoved', function(uploader, files){

            });

            uploader.bind('UploadProgress', function (up, file) {
                //$$(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
                //jQuery('.attachment-fields').last().children('.progress').children('.bar').css('width', file.percent + '%');
            });

            uploader.bind('QueueChanged', function(uploader){
                if(uploader.files.length > 0 && !scope.showUploadBtn){
                    scope.showUploadBtn = true;
                    scope.$digest();

                    var startUploadBtn = angular.element('#upload-files');

                    startUploadBtn.bind('click', function(event){
                        scope.showUploadBtn = false;
                        scope.$digest();

                        // Remove all form fields related to attachments
                        jQuery('.attachment-fields').remove();

                        var progress = '<div class="upload-progress clearfix"><div id="block-1" class="little-block"></div> \
                                       <div id="block-2" class="little-block"></div> \
                                       <div id="block-3" class="little-block"></div> \
                                       <div id="block-4" class="little-block"></div> \
                                       <div id="block-5" class="little-block"></div> \
                                       <div id="block-6" class="little-block"></div> \
                                       <div id="block-7" class="little-block"></div> \
                                       <div id="block-8" class="little-block"></div> \
                                       <div id="block-9" class="little-block"></div></div>'

                        jQuery('#container').append(progress);

                        uploader.start();
                    });
                }
            });

            var content;

            var attachmentDivPos = 0;

            uploader.bind('FileUploaded', function(uploader, file, response){
                content = scope.$eval("(" + response.response + ")");
                content = scope.$eval("(" + content.content + ")");

                function getMimeType(mimetype){
                    switch (mimetype)
                    {
                        case 'text/plain':
                            return 'txt';
                        case 'application/pdf':
                            return 'pdf'
                        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                            return 'word'
                        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                            return 'ppt'
                    }
                }

                // get the element in the array of attachments and create a new request object

                scope.attachments.forEach(function(attachment, index, array){
                    if(attachment.file_id === file.id){
                        // make an xhr and create a resource for this attachment
                        var date = new Date();

                        var utc_timestamp = Date.UTC(date.getFullYear(),date.getMonth(), date.getDate() ,
                            date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

                        //$scope.newArticle.key = ;
                        var title = attachment.title === '' ? 'This attachment doesn\'t have a title' : attachment.title;
                        var description = attachment.description === '' ? 'This attachment doesn\'t have a description' : attachment.description;
                        var attachment = {
                            dataType: 'resources',
                            title: title,
                            description: description,
                            key: 'attachment-key-' + utc_timestamp,
                            author: scope.$parent.$root.auth.principal.username,
                            format: 'attachment',
                            mimetype: content.mimetype,
                            uri: content.uri,
                            views: 0,
                            likes: 0,
                            comments: 0,
                            rating: 0
                        };

                        var attachmentId;

                        $http.post('api/attachments', attachment)
                            .success(function(data, status){
                                var date = new Date();
                                date = date.getMonth()+1 +'/'+date.getDate()+'/'+date.getFullYear();

                                // remove this attachment from the attachments array
                                attachmentId = data.content._id;
                                scope.article.attachments.push(attachmentId);
                                scope.attachments.splice(index, 1);

                                var attachmentDiv = '<div class="discussion-stack-container attachment" style="top:'+ attachmentDivPos+'em;"> \
                                                        <div class="discussion-item grey-gradient"> \
                                                            <h4>'+ data.content.title +'</h4> \
                                                            <h6>By '+ data.content.author +', '+ date +'</h6> \
                                                            <p class="muted">'+ data.content.description +'</p> \
                                                        </div> \
                                                        \
                                                        <div class="btn-group-border">\
                                                            <div class="btn-group bgc">\
                                                                <button ng-click="removeAttachment()" btn btn-warning"><i class="icon-remove-circle icon-white"></i> Remove</button>\
                                                            </div>\
                                                        </div>\
                                                        <div class="paper-clip"></div> \
                                                        <div class="attached-doc"> \
                                                            <div class="new-picture-frame small content-thumbnail attachment"> \
                                                                <span class="doc-type '+ getMimeType(data.content.mimetype) +'"></span> \
                                                                <img src="images/document-default.jpg" alt="">\
                                                            </div>\
                                                        </div>';

                                attachmentDivPos -= 3;

                                jQuery('#attachment-list').append(attachmentDiv);

                                jQuery('.discussion-stack-container.attachment').last().click(function(){
                                    $('.discussion-stack-container.attachment').css('z-index', '1');
                                    $(this).css('z-index', '20');
                                })

                            })
                            .error(function(data, status){

                            });
                        return;
                    }
                });

            });

            uploader.bind('UploadComplete', function(uploader, file){
                jQuery('.upload-progress').remove();
                scope.showUploadBtn = false;
            });

            uploader.init();
        }
    }
}]);

angular.module('bgc.directives').directive('slideShow', ['$log', function($log){
    return{
        restrict: 'A',
        scope: {
            //images: '='
        },
        templateUrl: 'partials/slideshow-template.html',
        link: function(scope, elm, attrs){
            var options = scope.$eval(attrs.slideShow);
            if(attrs.slideShow){
                if(options.images){
                    scope.images = options.images;
                }
            }
            //scope.images =
            $('.summit-slide-show').slides({
                container: 'slides',
                next: 'forward',
                prev: 'backward',
                pagination: false,
                generatePagination: false
            });

            scope.showSlideshowModal = false;

            scope.slideshowModal = function(image, elm, page){
                $log.info('Showing modal with image: ' + image);
                scope.modalImage = image;

                //$('.thumb').removeClass('active-thumb');
                //$(elm.parentElement).addClass('active-thumb');

                //scope.page = page;
                scope.$broadcast('chosenSlide');

                scope.showSlideshowModal = true;
            }

            scope.closeSummitModal = function(){
                scope.showSlideshowModal = false;
            }

            scope.$on('hideModal', function(){
                scope.showSlideshowModal = false;
            });
        }
    }
}]);

angular.module('bgc.directives').directive('slideShowModal', function(){
    return {
        restrict: 'A',
        scope: {},
        //templateUrl: 'partials/slideshow-modal-template.html',
        link: function(scope, elm, attrs){
            scope.page = 1;
            $('.slideshow-thumbs').slides({
                container: 'modal-slides',
                next: 'modal-forward',
                prev: 'modal-backward',
                pagination: false,
                generatePagination: false,
                effect: 'fade',
                fadeSpeed: 350
                //start: scope.$parent.page
            });

            scope.showLargeImage = function(image, elm, page){
                scope.$parent.modalImage = image;
                /*$('.summit-modal-detail').fadeOut('slow');
                $('.summit-modal-detail').fadeIn('slow');*/
                $('.thumb').removeClass('active-thumb');
                $(elm.parentElement).addClass('active-thumb');
                //scope.page = page;
            }

            scope.$on('chosenSlide', function(){
                /*scope.page = scope.$parent.page;

                page = Math.floor(scope.$parent.page / 5) + 1;
                console.log(page);*/
            });

            scope.incrementPage = function(){
                if(scope.page === 5){
                    scope.page = 0;
                }
                scope.page++;
            }

            scope.decrementPage = function(){
                if(scope.page === 1){
                    scope.page = 6;
                }
                scope.page--;
            }
        }
    }
});

angular.module('bgc.directives').directive('roleToggleUser', ['Profile', function(Profile){
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, elm, attrs){
            elm.button('toggle');
        }
    }
}]);

angular.module('bgc.directives').directive('roleToggleAdmin', ['Profile', function(Profile){
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, elm, attrs){
            var profile;
            attrs.$observe('user', function(user){
                if(user !== '{}'){
                    profile = scope.$eval(user);
                    if(profile.roles.indexOf('ROLE_ADMIN') !== -1){
                        elm.button('toggle');
                    }
                }
            });

            elm.bind('click', function(){
                if(profile.roles.indexOf('ROLE_ADMIN') !== -1){
                    profile.roles.splice(profile.roles.indexOf('ROLE_ADMIN'), 1);
                }else{
                    profile.roles.push('ROLE_ADMIN');
                }

                delete profile.facultyFellow;
                delete profile.isUserFollowing;
                delete profile.newPass;
                delete profile.newPassRepeat;

                Profile.update({profileId: profile._id}, profile, function(response){

                }, function(response){
                    log.info('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
                });
            });
        }
    }
}]);

angular.module('bgc.directives').directive('roleToggleMember', ['Profile', function(Profile){
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, elm, attrs){
            var profile;
            attrs.$observe('user', function(user){
                if(user !== '{}'){
                    profile = scope.$eval(user);
                    if(profile.roles.indexOf('ROLE_MEMBER') !== -1 || profile.roles.indexOf('ROLE_ADMIN') !== -1 && profile){
                        elm.button('toggle');
                    }
                }
            });

            elm.bind('click', function(){
                if(profile.roles.indexOf('ROLE_MEMBER') !== -1){
                    profile.roles.splice(profile.roles.indexOf('ROLE_MEMBER'), 1);
                }else{
                    profile.roles.push('ROLE_MEMBER');
                }

                delete profile.facultyFellow;
                delete profile.isUserFollowing;
                delete profile.newPass;
                delete profile.newPassRepeat;

                Profile.update({profileId: profile._id}, profile, function(response){

                }, function(response){
                    log.info('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
                });
            });
        }
    }
}]);
