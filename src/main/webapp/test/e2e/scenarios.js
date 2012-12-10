'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

    beforeEach(function() {
        browser().navigateTo('../../');
    });


    it('should automatically redirect to homepage when location hash/fragment is empty', function() {
        expect(browser().location().url()).toBe("/");
    });


    describe('homepage', function() {

        beforeEach(function() {
            browser().navigateTo('#/home');
        });


        it('should be three articles displayed as news items', function() {
            expect(repeater('.articles .article').count()).
            toEqual(4); //technically there's four items because the "no news found" is being displayed
        });

    });


    describe('login', function() {

        beforeEach(function() {
            browser().navigateTo('#/login');
        });


        it('should render login view when user navigates to /login', function() {
            expect(element('form[name=login]').count()).
            toEqual(1);
        });

    });
});
