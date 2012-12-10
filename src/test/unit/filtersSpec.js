'use strict';

/* jasmine specs for filters go here */

describe('filter', function() {
  beforeEach(module('bgc.filters'));


    describe('asDate', function() {
        it('should show 9/9/1999', inject(function(asDateFilter) {
            expect(asDateFilter('1999-09-09T22:28:48')).toEqual('9/9/1999');
            expect(asDateFilter('1999-09-09T22:28:48.000Z')).toEqual('9/9/1999');
        }));
    });

    //i'm not entirely sure how to test this without really just testing jquery's timeago plugin
    /*describe('timeago', function() {
        it('should show 1 hour', inject(function(timeagoFilter) {
            var now = new Date();
            var test = now;
            test.setHours(now.getHours() - 1);
            expect(timeagoFilter(test)).toEqual('1 hour ago');
        }));
    });*/

    describe('pluralize', function() {
        it('should show 5 wickets', inject(function(pluralizeFilter) {
            expect(pluralizeFilter(5, 'wicket')).toEqual('5 wickets');
        }));

        it('should show 1 wicket', inject(function(pluralizeFilter) {
            expect(pluralizeFilter(1, 'wicket')).toEqual('1 wicket');
        }));

        it('should show 0 wickets', inject(function(pluralizeFilter) {
            expect(pluralizeFilter(0, 'wicket')).toEqual('0 wickets');
        }));
    });
});
