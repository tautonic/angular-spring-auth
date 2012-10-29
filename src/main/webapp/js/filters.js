'use strict';

/* Filters */

angular.module('bgc.filters', [])
    .filter( 'asDate', function () {
        return function (dateInput) {
            var date = new Date(dateInput);
            return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
        }
    }).filter( 'timeago', function () {
        return function (dateInput) {
            var date = new Date(dateInput);
            return jQuery.timeago(date);
        }
    });


