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
            url: '',
            restrict:'E',
            template: '<iframe src="" style="width:98%; height:730px;" frameborder="3px"></iframe>',
            compile: function(element, attrs, transclude){
                var isGoogleDoc = true;

                if(attrs.googleDoc){
                    isGoogleDoc = attrs.googleDoc == 'true' ? true : false;
                }

                if(isGoogleDoc){
                    element.context.firstChild.src = attrs.url;
                }else{
                    element.context.firstChild.src = 'http://docs.google.com/viewer?url=' + attrs.url + '&embedded=true';
                }
            }
        }
    });
