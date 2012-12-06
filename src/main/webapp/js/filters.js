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
                return 'Curriculum Advisory Services'
            case 'access':
                return 'Access To Babson Curriculum'
            case 'facultydev':
                return 'Faculty Development'
            case 'nextopp':
                return 'Next Opportunity'
            case 'handbook':
                return 'Handbook'
            case 'entrepreneurship':
                return 'Entrepreneurship Center Development'
            case 'gceemsce':
                return 'GCEE MSCE'
        }
    }
});


