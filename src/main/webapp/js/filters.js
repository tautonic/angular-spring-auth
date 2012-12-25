'use strict';

/* Filters */

angular.module('bgc.filters', []);

angular.module('bgc.filters').filter('asDate', function(){
    return function (dateInput) {

        var date = new Date(dateInput);
        if(isNaN(date.getMonth()) && dateInput !== undefined) {
            //IE8 does not support the '-' character in the Date() argument
            dateInput = dateInput.replace('-', '/').replace('.000Z', '');
            date = new Date(dateInput);
        }
        return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
    }
});

angular.module('bgc.filters').filter('timeago', function(){
    return function (dateInput) {

        var date = new Date(dateInput);
        if(isNaN(date.getMonth()) && dateInput !== undefined) {
            //IE8 does not support the '-' character in the Date() argument
            dateInput = dateInput.replace('-', '/').replace('.000Z', '');
            date = new Date(dateInput);
        }

        return jQuery.timeago(date);
    }
});

angular.module('bgc.filters').filter('pluralize', function(){
    return function(number, text) {
        if(number === 1) {
            return (number + " " + text);
        } else {
            return (number + " " + text + "s");
        }
    }
});

angular.module('bgc.filters').filter('category', function(){
    return function(category){
        switch (category){
            case 'curriculum':
                return 'Curriculum Advisory Services';
            case 'access':
                return 'Access To Babson Curriculum';
            case 'facultydev':
                return 'Faculty Development';
            case 'nextopp':
                return 'Next Opportunity';
            case 'handbook':
                return 'Handbook';
            case 'entrepreneurship':
                return 'Entrepreneurship Center Development';
            case 'gceemsce':
                return 'GCEE MSCE';
            case 'summit':
                return 'Annual Summit';
        }
    }
});

//strips the <p> tags from cms content
angular.module('bgc.filters').filter('notags', function(){
    return function(text) {
        if(text) {
            text = text.replace("<p>", "");
            text = text.replace("</p>", "");
        }
        return text;
    }
});

angular.module('bgc.filters').filter('shorten', function(){
    return function(string, length){
        // only run when the substr function is broken
        if ('ab'.substr(-1) != 'b'){
            /**
             *  Get the substring of a string
             *  @param  {integer}  start   where to start the substring
             *  @param  {integer}  length  how many characters to return
             *  @return {string}
             */
            String.prototype.substr = function(substr) {
                return function(start, length) {
                    // did we get a negative start, calculate how much it is from the beginning of the string
                    if (start < 0) start = this.length + start;

                    // call the original function
                    return substr.call(this, start, length);
                }
            }(String.prototype.substr);
        }

        if(string.length > 22){
            return string.substr(0, 11) + '...' + string.substr(-11);
        }

        return string;
    }
});
