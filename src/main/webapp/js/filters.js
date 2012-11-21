'use strict';

/* Filters */

angular.module('bgc.filters', [])
    .filter( 'asDate', function () {
        return function (dateInput) {
            //IE8 does not support the '-' character in the Date() argument
            dateInput = dateInput.replace('-', '/').replace('.000Z', '');
            var date = new Date(dateInput.toString());
            return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
        }
    }).filter( 'timeago', function () {
        return function (dateInput) {
            return jQuery.timeago(new Date(dateInput));
        }
    }).filter('pluralize', function() {
        return function(number, text) {
            if(number === 1) {
                return (number + " " + text);
            } else {
                return (number + " " + text + "s");
            }
        }
    });


