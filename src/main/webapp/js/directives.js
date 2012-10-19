'use strict';

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
angular.module( 'bgc.directives', [] )
    .directive('thumbnail', function(){

        return{
            restrict: 'A',
            templateUrl: 'partials/thumbnail-template.html',
            scope: {
                auth: '=',
                thumb: '='
            },
            link: function(scope, elm, attr){
                scope.thumbnail = {
                    image: 'images/GCEE_image_profileFemale_135x135.jpeg',
                    text: 'Read More',
                    style: 'profile-thumbnail large counter-clockwise',
                    facultyFellow: false
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
angular.module('bgc.directives')
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
angular.module('bgc.directives')
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
    }]);

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
    }]);

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
            }
        }
    }]);

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
                }
            }
        }
    });

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
                auth: '='
            },
            //transclude: 'element',
            templateUrl: 'partials/activityStreamItem.html',
            link: function(scope, elm, attrs){
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
 * @example <li ui-tabs="{tab1:{label:'This is the first tab'}, tab2:{label: 'this is the second tab'}}">
 * <div>content of tab1</div>
 * <div>content of tab2</div>
 * </li>
 */
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
                            val.element.show();
                        }
                        else
                            val.element.hide();
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
                var stacks = value;

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

angular.module('bgc.directives').directive('reloadTwitterBtns', function(){
    'use strict'

    return {
        link: function(scope, element, attrs){
            scope.$on('$routeChangeSuccess', function(){
                twttr.widgets.load();
            });
        }
    }
});
