'use strict';

/* Services */
// Demonstrate how to register services
// In this case it is a simple value service.
// This is a service that creates a resource called Profile
angular.module( 'bgc.services', ['ngResource'] )
    .factory('Profile', function($resource){
        return $resource('api/profiles/:profileId',
            {},
            {
                update:     { method: 'PUT', isArray: false },
                query:     { method: 'GET', isArray: false },
                email:     { method: 'GET', isArray: false },
                username:   { method: 'GET', isArray: false }
            }
        );
    })
    .factory('Search', function($resource){
        return $resource('api/search/:type',
            {},
            {
                site:     { method: 'POST', isArray: false },
                faculty:     { method: 'POST', isArray: false },
                content:     { method: 'POST', isArray: false },
                discussions:     { method: 'POST', isArray: false }
            }
        );
    })
    .factory('Article', function($resource){
        return $resource('api/admin/articles/:articleId',
            {},
            {
                update: { method: 'PUT', isArray: false },
                query:  { method: 'GET', isArray: false }
            }
        );
    });

angular.module('bgc.services')
    .factory('generateDescription', function(){
        return function (content){
            var result = content;
            var resultArray = result.split(" ");
            if(resultArray.length > 30){
                resultArray = resultArray.slice(0, 30);
                result = resultArray.join(" ") + " ...";
            }
            return result;
        }
    });

angular.module('bgc.services')
    .factory('bgcFileBrowser', function(){
        return function (field_name, url, type, win){
            tinyMCE.activeEditor.windowManager.open({
                // baseUrl defined in index.html
                file : baseUrl + 'partials/tinymceuploads.html',
                title : 'Babson GCEE Insert/Upload',
                width : 600,  // Your dimensions may differ - toy around with them!
                height : 220,
                resizable : "yes",
                inline : "yes",  // This parameter only has an effect if you use the inlinepopups plugin!
                close_previous : "no"
            }, {
                window : win,
                input : field_name
            });
            return false;
        }
    });

angular.module('bgc.services')
    .factory('ISODateString', function(){
        return function (d){
            function pad(n){return n<10 ? '0'+n : n}
                return d.getUTCFullYear()+'-'
                    + pad(d.getUTCMonth()+1)+'-'
                    + pad(d.getUTCDate())+'T'
                    + pad(d.getUTCHours())+':'
                    + pad(d.getUTCMinutes())+':'
                    + pad(d.getUTCSeconds())+'Z'
        }
    });

angular.module('bgc.services')
    .factory('getPossibleMimetypes', function(){
        return function(m){
            var mimetype;
            switch(m)
            {
                case 'application/pdf':
                    mimetype = 'pdf';
                    break;
                case 'application/msword':
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    mimetype = 'word';
                    break;
                case 'application/mspowerpoint':
                case 'application/powerpoint':
                case 'application/vnd.ms-powerpoint':
                case 'application/x-mspowerpoint':
                case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                    mimetype = 'ppt';
                    break;
                case 'application/excel':
                case 'application/vnd.ms-excel':
                case 'application/x-excel':
                case 'application/x-msexcel':
                case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                    mimetype = 'xls';
                    break;
                case 'application/rtf':
                case 'application/x-rtf':
                case 'text/richtext':
                    mimetype = 'rtf';
                    break;
                default:
                    //this handles video and image cases, and defaults to text if it doesn't know what it is
                    if(mimetype != undefined)
                    {
                        mimetype = mimetype.split('/')[0];
                    } else {
                        mimetype = "text";
                    }
                    break;
            }

            return mimetype;
        }
    });

//angular.module('bgc.services', ['ngResource'] )


