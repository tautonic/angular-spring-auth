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

var animation = false,
    domPrefixes = 'Webkit Moz O ms Khtml'.split(' ');

if(document.body != null) {
    if(document.body.style.animationName)  { animation = true; }

    if( (animation === false) ) {
        for( var i = 0; i < domPrefixes.length; i++ ) {
            if( document.body.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                animation = true;
                break;
            }
        }
    }
}

var ajaxLoader = (animation) ? '<div class="upload-progress clearfix"><div id="block-1" class="little-block"></div> \
                                       <div id="block-2" class="little-block"></div> \
                                       <div id="block-3" class="little-block"></div> \
                                       <div id="block-4" class="little-block"></div> \
                                       <div id="block-5" class="little-block"></div> \
                                       <div id="block-6" class="little-block"></div> \
                                       <div id="block-7" class="little-block"></div> \
                                       <div id="block-8" class="little-block"></div> \
                                       <div id="block-9" class="little-block"></div></div>' :
                                '<div class="upload-progress clearfix"><img src="images/ie-loader.gif"></div>';

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
                    text: 'Read More',
                    style: 'profile-thumbnail large counter-clockwise'
                };

                //allows the user to switch between the "male" and "female" default portraits
                scope.togglePortrait = function(){
                    if(scope.defaultImage === 'images/GCEE_image_defaultMale.jpeg'){
                        scope.defaultImage = 'images/GCEE_image_defaultFemale.jpeg';
                    }else if(scope.defaultImage === 'images/GCEE_image_defaultFemale.jpeg'){
                        scope.defaultImage = 'images/GCEE_image_defaultMale.jpeg';
                    }

                    scope.$emit('togglePortrait');
                };

                scope.showAttachmentModal = function(){
                    scope.$emit('showAttachmentModal', {});
                };

                if(attr.type === 'profile' || !attr.type){
                    scope.thumbnail.type = attr.type;

                    //set the style based on size and rotation, if they exist, otherwise use default values
                    scope.thumbnail.style = 'profile-thumbnail ' +
                        ((attr.size) ? attr.size : 'large') + ' ' +
                        ((attr.rotation) ? attr.rotation : 'counter-clockwise');

                    return;
                }

                if(attr.type === 'article' || attr.type === 'content'){
                    scope.thumbnail.type = attr.type;
                    scope.thumbnail.style = attr.type + '-thumbnail no-rotation';

                    if(attr.text){
                        scope.thumbnail.text = attr.text;
                    }
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
                    isGoogleDoc = (attrs.googleDoc === "true");
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


angular.module('bgc.directives')
    .directive('pyklProfileImageUpload', ['$http', '$log', function($http, $log){

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

            // from this point onward, access to the scope object is only available
            // by adding it as a property to this config object
            var config = {
                scope: scope,
                runtimes: 'html5, flash, silverlight, html4, browserplus',
                browse_button: 'choose-files',
                container: 'profile-image-upload',
                url: 'api/cms/upload/image',
                max_file_size:'3mb',
                multi_selection:false,
                resize:{"width":650, "quality":90},
                flash_swf_url:'lib/pykl-angular-ui/plupload/js/plupload.flash.swf',
                silverlight_xap_url:'lib/pykl-angular-ui/plupload/js/plupload.silverlight.xap',
                filters:[
                    {title:"Image files", extensions:"jpg,gif,png,jpeg"},
                    {title:"Zip files", extensions:"zip"}
                ]
            };

            var scope = config.scope;

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
                jQuery('.info.image h3').after(ajaxLoader);

                $('.jcrop-holder').append('<img id="image-crop" src="" alt="">');

                setTimeout(function () {
                    uploader.start();
                }, 500);
            });

            uploader.bind('BeforeUpload', function(upload, file){
                upload.settings.multipart_params = {size: file.size}
            });

            var url;
            var assetKey;

            uploader.bind('FileUploaded', function(uploader, file, response){
                var content = angular.fromJson(response.response);

                url = content.file.uri;

                // file has been uploaded, let's create a resource and send that to zocia
                var resource = {
                    "name": content.file.name,
                    "locale": "en" ,
                    "author": "",
                    "dataType": "resources",
                    "category": "",
                    "taggable": [] ,
                    "title": "",
                    "description": "",
                    "likes": 0,
                    "comments": 0,
                    "uri": url,
                    "mimetype": content.file.contentType
                };

                $http.post('api/profiles/image/resource', resource)
                    .success(function(data, status){
                        assetKey = data.content.key;
                    });
            });

            var jcropApi;

            cancelCropBtn.bind('click', function(){
                $('.upload-progress').remove();
                $('.jcrop-holder').empty();
                $('.profile-crop-preview').hide();
            });

            saveCropBtn.bind('click', function(){
                jQuery('.info.image h3').after(ajaxLoader);

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
                        //uri = uri.replace(/http:/, '');

                        delete profile.isUserFollowing;
                        delete profile.facultyFellow;

                        profile.thumbnail = uri;
                        scope.$parent.updateThumbnailUri(profile);
                    }).error(
                    function(){
                        $log.info('Image crop error!');
                    }
                );

                $('.profile-crop-preview').hide();
            });

            uploader.bind('UploadComplete', function(uploader, file){
                $('.upload-progress').remove();
                $('.profile-crop-preview').show();

                $('.jcrop-holder img').attr('src', url);

                $('#image-crop').attr('src', url);

                $('#image-crop').Jcrop({
                    bgColor: '#fff',
                    onChange: showPreview,
                    aspectRatio: 1
                }, function(){
                    jcropApi = this;
                    var cropDimensions = Math.min(parseInt($('.jcrop-holder img').width()), parseInt($('.jcrop-holder img').height()));

                    var distanceToCropCenter = Math.floor(cropDimensions/2);
                    var distanceToImageCenter = Math.floor($('.jcrop-holder img').width()/2);

                    var shiftCropToCenter = Math.abs(distanceToCropCenter - distanceToImageCenter);

                    jcropApi.setSelect([shiftCropToCenter, 0, cropDimensions, cropDimensions]);
                    scope.cropDisabled = false;
                    scope.$apply();
                });

                function showPreview(coords){
                    if(coords.w > 50){
                        scope.cropDisabled = false;
                        scope.$apply();
                    }else{
                        scope.cropDisabled = true;
                        scope.$apply();
                    }
                }
            });

            uploader.init();
        }
    }
}]);

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
                                    message = 'This email address is already in use.';
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

                scope.$on('$routeChangeStart', function(){
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

                scope.$on('$routeChangeStart', function(){
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

                scope.$on('$routeChangeStart', function(){
                    jQuery('.tooltip').remove();
                });
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
            //require: 'ngModel',
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
            }
        }
    }
]);

angular.module('bgc.directives').directive('discussionStack', ['$compile', function($compile){
    'use strict';
    return {
        scope: {
            discussion: '=',
            last: '='
        },
        compile: function compile(element, attrs){
            var commentCount = [];
            var index;

            var height;
            return function (scope, element, attrs){
                commentCount.push(scope.discussion.commentCount);

                if(scope.last){
                    $('.discussion-item').each(function(index, elm){
                        var top = 5;
                        var left = 5;
                        var zIndex = -1;

                        var stacks = Math.floor(commentCount[index]/5);

                        for(var i=0; i < stacks; i++){
                            var div = document.createElement('div');
                            div = jQuery(div);
                            div.addClass('discussion-item discussion-stack-div grey-gradient');

                            height = $(this).innerHeight() - 8;

                            div.css({
                                'width': $(this).css('width'),
                                'height': height,
                                'top': top,
                                'left': left,
                                'z-index': zIndex
                            });

                            $(this).parent('.discussion-stack-container').append(div);
                            scope.$apply();

                            top += 5;
                            left += 5;
                            zIndex -= 1;
                        }
                    });
                }
            }
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
 * @example <div when-scrolled="loadMore()" offset="90">
 */
angular.module('bgc.directives').directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        /*var raw = elm[0];
        var offset = attr.offset || 0;
        angular.element(window).bind('scroll', function() {
            var rectObject = raw.getBoundingClientRect();
            //200 is the value of the footer height and some other things. offset is passed in as an option and is used for
            if (Math.floor(rectObject.bottom) === $(window).height() - 200 - offset) {
                scope.$apply(attr.whenScrolled);
            }

        });*/
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

/**
 * This changes the text of a button to "Are You Sure?" and requires the user to click a second time before performing the action. Requires parameters to be passed into the directive
 *
 * @param [areYouSure] {object} This requires a function passed in with the "call" argument, which will be called upon the second click.
 *                          It also allows an arbitrary amount of arguments, which will be sent to the 'call' function, allowing it to be used there
 *                          This is mostly useful for admin type buttons, with things like deleting or resetting stuff
 * @example are-you-sure="{ call: deleteArticle, article: article }"
 */
angular.module('bgc.directives').directive('areYouSure', function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var attr = scope.$eval(attrs.areYouSure);
            var check = false;
            elm.bind('click', function(){
                if(!check) {
                    elm.html('<i class="icon-question-sign icon-white"></i> Are You Sure?');
                    check = true;
                    return;
                }

                attr.call(elm, attr);
            });
        }
    }
});

angular.module('bgc.directives').directive('pyklFileAttachment', ['$http', '$log', '$compile', '$window', function($http, $log, $compile, $q, $window){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs){
            var config = {
                scope: scope,
                runtimes: 'html5, flash, silverlight, browserplus',
                browse_button: 'choose-files',
                container:'attachment-upload',
                url: 'api/cms/upload/image',
                max_file_size:'10mb',
                multi_selection:false,
                resize:{"width":320, "height":240, "quality":90},
                flash_swf_url:'lib/pykl-angular-ui/plupload/js/plupload.flash.swf',
                silverlight_xap_url:'lib/pykl-angular-ui/plupload/js/plupload.silverlight.xap',
                filters:[
                    {title : "Image files", extensions : "pdf,doc,ppt,txt,jpg,jpeg,xls"},
                    {title:"Zip files", extensions:"zip"}
                ]
            };

            function $$(id) {
                return document.getElementById(id);
            }

            var uploader = new plupload.Uploader(config);

            var scope = config.scope;

            uploader.bind('FilesAdded', function (up, files) {
                var attachment = {
                    title: '',
                    description: '',
                    _id: '',
                    resourceId: ''
                };

                var attachmentFields;

                if(scope.newAttachments){
                    attachment._id = files[0].id;
                    scope.newAttachments.push(attachment);

                    scope.$apply();

                    attachmentFields = jQuery('.new-attachment-fields').last();
                    attachmentFields.children('.filename').children('.control-group').children('.controls').html(files[0].name + ' (' + plupload.formatSize(files[0].size) + ') <button id="file-'+files[0].id+'" data-fileid="'+files[0].id+'" class="close">&times; Remove Attachment</button>');

                    $('#file-' + files[0].id).click(function(){
                        up.removeFile(up.getFile($(this).data('fileid')));
                        $(this).closest('.new-attachment-fields').fadeOut(function(){
                            $(this).remove();
                        });
                    });
                }else{
                    attachment._id = files[0].id;
                    scope.attachments.push(attachment);

                    scope.$apply();

                    attachmentFields = jQuery('.attachment-fields').last();
                    attachmentFields.children('.filename').children('.control-group').children('.controls').html(files[0].name + ' (' + plupload.formatSize(files[0].size) + ') <button id="file-'+files[0].id+'" data-fileid="'+files[0].id+'" class="close">&times; Remove Attachment</button>');

                    $('#file-' + files[0].id).click(function(){
                        up.removeFile(up.getFile($(this).data('fileid')));
                        $(this).closest('.attachment-fields').fadeOut(function(){
                            $(this).remove();
                        });
                    });
                }
            });

            uploader.bind('BeforeUpload', function(upload, file){
                upload.settings.multipart_params = {size: file.size}
            });

            scope.$on('saveArticle', function(){
                uploader.start();

                var progress = ajaxLoader;

                $('#attachment-upload').prepend(progress).append(progress);

                scope.disabled = true;
            });

            var content;
            var fileAttachments = [];

            uploader.bind('FileUploaded', function(uploader, file, response){
                var content = angular.fromJson(response.response);

                var date = new Date();

                var utc_timestamp = Date.UTC(date.getFullYear(),date.getMonth(), date.getDate() ,
                    date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

                var attachments = [];

                if(scope.newAttachments){
                    attachments = scope.newAttachments.slice(0);
                }else{
                    attachments = scope.attachments.slice(0);
                }

                attachments.forEach(function(attachment){
                    if(file.id === attachment._id){
                        var title = attachment.title === '' ? 'This attachment doesn\'t have a title' : attachment.title;
                        var description = attachment.description === '' ? 'This attachment doesn\'t have a description' : attachment.description;
                        var resource = {
                            dataType: 'resources',
                            ref: '',
                            title: title,
                            description: description,
                            key: 'attachment-key-' + utc_timestamp,
                            author: scope.$parent.$root.auth.principal.username,
                            format: 'attachment',
                            mimetype: content.file.contentType,
                            uri: content.file.uri,
                            views: 0,
                            likes: 0,
                            comments: 0,
                            rating: 0,
                            name: file.name,
                            filesize: plupload.formatSize(file.size),
                            roles: (scope.article.premium) ? ['ROLE_USER', 'ROLE_PREMIUM'] : ['ROLE_USER'],
                            thumbnail: 'images/row-of-columns.jpg',
                            category: ((scope.article.category === '') ? 'curriculum' : scope.article.category)
                        };

                        fileAttachments.push(resource);
                    }
                });
            });

            uploader.bind('UploadComplete', function(uploader, files){
                fileAttachments.forEach(function(attachment){
                    $http.post('api/attachments', attachment)
                        .success(function(data, status){
                            scope.article.attachments.push(data.content._id);
                            scope.$emit('attachmentUploadComplete');
                            $('.upload-progress').remove();
                        });
                });
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
            };

            scope.closeSummitModal = function(){
                scope.showSlideshowModal = false;
            };

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
            };

            scope.$on('chosenSlide', function(){
                /*scope.page = scope.$parent.page;

                page = Math.floor(scope.$parent.page / 5) + 1;*/
            });

            scope.incrementPage = function(){
                if(scope.page === 5){
                    scope.page = 0;
                }
                scope.page++;
            };

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

angular.module('bgc.directives').directive('roleTogglePremium', ['Profile', function(Profile){
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, elm, attrs){
            var profile;
            attrs.$observe('user', function(user){
                if(user !== '{}'){
                    profile = scope.$eval(user);
                    if(profile.roles.indexOf('ROLE_PREMIUM') !== -1)
                    {
                        elm.button('toggle');
                    }
                }
            });

            elm.bind('click', function(){
                if(profile.roles.indexOf('ROLE_PREMIUM') !== -1){
                    profile.roles.splice(profile.roles.indexOf('ROLE_PREMIUM'), 1);
                }else{
                    profile.roles.push('ROLE_PREMIUM');
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

angular.module('bgc.directives').directive('roleToggleEditor', ['Profile', function(Profile){
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, elm, attrs){
            var profile;
            attrs.$observe('user', function(user){
                if(user !== '{}'){
                    profile = scope.$eval(user);
                    if(profile.roles.indexOf('ROLE_EDITOR') !== -1)
                    {
                        elm.button('toggle');
                    }
                }
            });

            elm.bind('click', function(){
                if(profile.roles.indexOf('ROLE_EDITOR') !== -1){
                    profile.roles.splice(profile.roles.indexOf('ROLE_EDITOR'), 1);
                }else{
                    profile.roles.push('ROLE_EDITOR');
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

angular.module('bgc.directives').directive('removeAttachment', ['$http', function($http){
    return {
        restrict: 'A',
        scope: {
            attachment: '='
        },
        link: function(scope, elm, attrs){
            elm.bind('click', function(){
                // remove the attachment from the array of article attachments
                scope.$parent.article.attachments.splice(scope.$parent.article.attachments.indexOf(scope.attachment._id), 1);
                // remove the attachment from the array attached to the scope
                //scope.$parent.$parent.attachments.splice(scope.$parent.$parent.attachments.indexOf(scope.attachment._id), 1);
                //$http.post('api/attachments/delete/' + scope.attachment._id)
                //$http.delete('api/attachments/delete/' + scope.attachment._id)
                $http['delete']('api/attachments/' + scope.attachment._id)
                    .success(function(){
                        // the article has to be updated as well
                        $http.put('api/admin/articles/' + scope.$parent.article._id, scope.$parent.article)
                            .success(function(data, status){
                                elm.closest('.attachment-fields').fadeOut(function(){
                                    $(this).remove();
                                });
                                elm.closest('.new-attachment-fields').fadeOut(function(){
                                    $(this).remove();
                                });
                            });
                    });
            });
        }
    }
}]);
