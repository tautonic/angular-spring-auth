'use strict';

/* jasmine specs for controllers go here */

describe('Babson GC Controllers', function(){
    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected){
                return angular.equals(this.actual, expected);
            }
        })
    });

    beforeEach(module('bgc.services'));

    describe('ProfileCtrl', function(){
        var scope, $httpBackend, $controller;

        var profile = {
            username: "todd",
            password: "password",
            accountEmail: {
                address: "todd@pykl.com",
                status: "unverified"
            }
        };

        beforeEach(inject(function($rootScope, _$httpBackend_, _$controller_){
            scope = $rootScope.$new();
            $httpBackend = _$httpBackend_;

            $httpBackend.when('GET', '/gc/api/profiles/').respond(
            {
                content: [
                    {
                        username: "james",
                        password: "password",
                        accountEmail: {
                            address: "jhines@pykl.com",
                            status: "unverified"
                        }
                    },
                    {
                        username: "kevin",
                        password: "password",
                        accountEmail: {
                            address: "kevin@pykl.com",
                            status: "unverified"
                        }
                    },
                    {
                        username: "eric",
                        password: "password",
                        accountEmail: {
                            address: "kevin@pykl.com",
                            status: "unverified"
                        }
                    }
                ]
            });

            $httpBackend.when('POST', '/gc/api/profiles/', profile).respond(201, {
                content: {
                    _id     : 123,
                    username: "todd",
                    password: "password",
                    accountEmail: {
                        address: "todd@pykl.com",
                        status: "unverified"
                    }
                }
            });

            $controller = _$controller_;

            $controller(ProfileCtrl, {$scope: scope});
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should make an xhr and return an array of profiles from which we grab the first element ', function() {
            expect(scope.profile).toBeUndefined();

            $httpBackend.flush();

            expect(scope.profile).toEqualData(
            {
                username: "james",
                password: "password",
                accountEmail: {
                    address: "jhines@pykl.com",
                    status: "unverified"
                }
            });

            expect(scope.isViewMode).toBeTruthy();
            expect(scope.isEditMode).toBeFalsy();
            expect(scope.isCreateMode).toBeFalsy();
        });

        it('should be in edit mode ', function(){
            scope.edit(profile);

            expect(scope.master).toEqualData(profile);

            expect(scope.isViewMode).toBeFalsy();
            expect(scope.isEditMode).toBeTruthy();
            expect(scope.isCreateMode).toBeFalsy();

            $httpBackend.flush();
        });

        it('should successfully update an existing profile ', function(){
            profile.username = "eric";
            profile.accountEmail.address = "eric@pykl.com";

            delete profile.accountEmail.status;

            $httpBackend.expectPUT('/gc/api/profiles/', profile).respond(200, {
                content: {
                    _id     : 123,
                    username: "eric",
                    password: "password",
                    accountEmail: {
                        address: "eric@pykl.com"
                    }
                }
            });

            scope.update(profile);

            $httpBackend.flush();

            expect(scope.responseContent).toEqualData(
            {
                _id     : 123,
                username: "eric",
                password: "password",
                accountEmail: {
                    address: "eric@pykl.com"
                }
            });

            expect(scope.isViewMode).toBeTruthy();
            expect(scope.isEditMode).toBeFalsy();
            expect(scope.isCreateMode).toBeFalsy();
        });

        it('should return an error on an unsuccessful update ', function(){
            profile.username = "eric";
            profile.accountEmail.address = "eric@pykl.com";

            delete profile.accountEmail.status;

            $httpBackend.expectPUT('/gc/api/profiles/', profile).respond(400, {
                content: {
                    _id     : 123,
                    username: "eric",
                    password: "password",
                    accountEmail: {
                        address: "eric@pykl.com"
                    }
                }
            });

            scope.update(profile);

            expect(scope.isViewMode).toBeFalsy();
            expect(scope.isEditMode).toBeTruthy();
            expect(scope.isCreateMode).toBeFalsy();

            $httpBackend.flush();

            expect(scope.responseContent).toEqual('UPDATE FAILED WITH AN ERROR OF: 400');

            expect(scope.isViewMode).toBeFalsy();
            expect(scope.isEditMode).toBeTruthy();
            expect(scope.isCreateMode).toBeFalsy();
        });

        it('should be in create mode ', function(){
            scope.create(profile);

            expect(scope.master).toEqualData(profile);
            expect(scope.profile).toEqualData({});

            expect(scope.isViewMode).toBeFalsy();
            expect(scope.isEditMode).toBeFalsy();
            expect(scope.isCreateMode).toBeTruthy();

            $httpBackend.flush();
        });

        it('should create a new profile and persist it ', function(){
            expect(scope.newProfile).toBeUndefined();

            scope.save(profile);

            $httpBackend.flush();

            expect(scope.newProfile).toBeDefined();

            expect(scope.profile._id).toEqual(123);

            expect(scope.responseContent).toEqualData(
            {
                _id     : 123,
                username: "todd",
                password: "password",
                accountEmail: {
                    address: "todd@pykl.com",
                    status: "unverified"
                }
            });

            expect(scope.isViewMode).toBeTruthy();
            expect(scope.isEditMode).toBeFalsy();
            expect(scope.isCreateMode).toBeFalsy();
        });
    });
});
