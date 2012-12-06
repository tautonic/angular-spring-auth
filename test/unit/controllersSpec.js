'use strict';
describe("A suite", function() {
    it("contains spec with an expectation", function() {
        expect(true).toBe(true);
    });
});
/* jasmine specs for controllers go here */
/***
describe('Babson GC Controllers', function(){
    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected){
                return equals(this.actual, expected);
            }
        })
    });

    beforeEach(angular.module('bgc.services'));

    /*************************
     * Discussion controller *
     *************************//*
    describe('DiscussionCtrlTest', function() {
        var scope, $httpBackend, $controller, defaultParams;

        var discussion = {
            "dataType": "posts",
            "dateCreated": "",
            "parentId": null,
            "type": "discussion",
            "creator":{
                "_id": 1,
                "username": "fred",
                "profilePicture": { 'filepath': "/img/bob.com" }
            },
            "title": "This is a discussion title",
            "message": "This is a discussion message",
            "ip": "10.16.151.115",
            "spam": 0,
            "likedBy": [],
            "likes": 0,
            "views":0,
            "active": true
        };

        beforeEach(inject(function($rootScope, _$httpBackend_, _$controller_){
            scope = $rootScope.$new();
            $httpBackend = _$httpBackend_;

            $httpBackend.when('GET', 'api/discussions/all').respond(
                {
                    content: [
                        {
                            "dataType": "posts",
                            "dateCreated": "",
                            "parentId": null,
                            "type": "discussion",
                            "creator":{
                                "_id": 1,
                                "username": "fred",
                                "profilePicture": { 'filepath': "/img/bob.com" }
                            },
                            "title": "This is a discussion title 1",
                            "message": "This is a discussion message",
                            "ip": "10.16.151.115",
                            "spam": 0,
                            "likedBy": [],
                            "likes": 0,
                            "views":0,
                            "active": true
                        },
                        {
                            "dataType": "posts",
                            "dateCreated": "",
                            "parentId": null,
                            "type": "discussion",
                            "creator":{
                                "_id": 1,
                                "username": "fred",
                                "profilePicture": { 'filepath': "/img/bob.com" }
                            },
                            "title": "This is a discussion title 2",
                            "message": "This is a discussion message",
                            "ip": "10.16.151.115",
                            "spam": 0,
                            "likedBy": [],
                            "likes": 0,
                            "views":0,
                            "active": true
                        }
                    ]
                });

            $httpBackend.when('GET', 'api/discussions/1').respond(
                    [
                        {
                            "dataType": "posts",
                            "dateCreated": "",
                            "parentId": 1,
                            "type": "discussion",
                            "creator":{
                                "_id": 1,
                                "username": "fred",
                                "profilePicture": { 'filepath': "/img/bob.com" }
                            },
                            "title": "This is a discussion title 1",
                            "message": "This is a discussion message",
                            "ip": "10.16.151.115",
                            "spam": 0,
                            "likedBy": [],
                            "likes": 0,
                            "views":0,
                            "active": true,
                            "children": []
                        }
                    ]
                );

            $httpBackend.when('POST', 'api/discussions/new').respond(
                { "newId": 1 }
            );

            $httpBackend.when('POST', 'api/discussions/1').respond(
                {
                    "dataType": "posts",
                    "dateCreated": "",
                    "parentId": 1,
                    "type": "discussion",
                    "creator":{
                        "_id": 1,
                        "username": "fred",
                        "profilePicture": { 'filepath': "/img/bob.com" }
                    },
                    "title": "",
                    "message": "[quote]Example Quoted[/quote]",
                    "ip": "10.16.151.115",
                    "spam": 0,
                    "likedBy": [],
                    "likes": 0,
                    "views":0,
                    "active": true
                }
            );

            $controller = _$controller_;

            var rootScope = $rootScope;
            rootScope.auth = {
                isAuthenticated: true,
                principal: "fred"
            };

            defaultParams = { $rootScope: rootScope, $scope: scope };
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should return a list of discussions ', function() {
            $controller(DiscussionCtrl, defaultParams);
            expect(scope.discussion).toBeUndefined();
            $httpBackend.flush();

            expect(scope.discussion).toEqualData(
                {
                    "content":[
                        {
                            "dataType": "posts",
                            "dateCreated": "",
                            "parentId": null,
                            "type": "discussion",
                            "creator":{
                                "_id": 1,
                                "username": "fred",
                                "profilePicture": { 'filepath': "/img/bob.com" }
                            },
                            "title": "This is a discussion title 1",
                            "message": "This is a discussion message",
                            "ip": "10.16.151.115",
                            "spam": 0,
                            "likedBy": [],
                            "likes": 0,
                            "views":0,
                            "active": true
                        },
                        {
                            "dataType": "posts",
                            "dateCreated": "",
                            "parentId": null,
                            "type": "discussion",
                            "creator":{
                                "_id": 1,
                                "username": "fred",
                                "profilePicture": { 'filepath': "/img/bob.com" }
                            },
                            "title": "This is a discussion title 2",
                            "message": "This is a discussion message",
                            "ip": "10.16.151.115",
                            "spam": 0,
                            "likedBy": [],
                            "likes": 0,
                            "views":0,
                            "active": true
                        }
                    ]
                });

            expect(scope.pageType).toEqual("all");
        });

        it('should return a single threaded discussion ', function() {
            defaultParams.$routeParams = { "discussionId": "1" };
            $controller(DiscussionCtrl, defaultParams);

            expect(scope.discussion).toBeUndefined();
            $httpBackend.flush();

            expect(scope.discussion).toEqualData(
                {
                    "dataType": "posts",
                    "dateCreated": "",
                    "parentId": 1,
                    "type": "discussion",
                    "creator":{
                        "_id": 1,
                        "username": "fred",
                        "profilePicture": { 'filepath': "/img/bob.com" }
                    },
                    "title": "This is a discussion title 1",
                    "message": "This is a discussion message",
                    "ip": "10.16.151.115",
                    "spam": 0,
                    "likedBy": [],
                    "likes": 0,
                    "views":0,
                    "active": true,
                    "children": []
                }
            );

            expect(scope.pageType).toEqual("single");
        });

        it('should post a reply to a single threaded discussion ', function() {
            defaultParams.$routeParams = { "discussionId": "1" };
            $controller(DiscussionCtrl, defaultParams);

            expect(scope.discussion).toBeUndefined();
            $httpBackend.flush();

            scope.replyTo("Example Quoted");

            expect(scope.reply).toEqualData({
                show: true,
                message: '[quote]Example Quoted[/quote]'
            });

            scope.submitReply();
            $httpBackend.flush();

            expect(scope.discussion).toEqualData(
                {
                    "dataType": "posts",
                    "dateCreated": "",
                    "parentId": 1,
                    "type": "discussion",
                    "creator":{
                        "_id": 1,
                        "username": "fred",
                        "profilePicture": { 'filepath': "/img/bob.com" }
                    },
                    "title": "This is a discussion title 1",
                    "message": "This is a discussion message",
                    "ip": "10.16.151.115",
                    "spam": 0,
                    "likedBy": [],
                    "likes": 0,
                    "views":0,
                    "active": true,
                    "children": [{
                        "dataType": "posts",
                        "dateCreated": "",
                        "parentId": 1,
                        "type": "discussion",
                        "creator":{
                            "_id": 1,
                            "username": "fred",
                            "profilePicture": { 'filepath': "/img/bob.com" }
                        },
                        "title": "",
                        "message": "[quote]Example Quoted[/quote]",
                        "ip": "10.16.151.115",
                        "spam": 0,
                        "likedBy": [],
                        "likes": 0,
                        "views":0,
                        "active": true
                    }]
                }
            );
        });

        it('should be on a new post page and then create the post ', function() {
            defaultParams.$routeParams = { "discussionId": "new" };
            $controller(DiscussionCtrl, defaultParams);

            expect(scope.pageType).toEqual("new");
            expect(scope.reply).toEqualData({
                show: false,
                title: '',
                message: ''
            });

            scope.reply = {
                show: false,
                title: 'Fake Title',
                message: 'Fake Message'
            };

            scope.createDiscussion();
            $httpBackend.flush();
        });
    });

    /**********************
     * Profile controller *
     **********************/ /*

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
    */