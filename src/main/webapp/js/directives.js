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
    });
