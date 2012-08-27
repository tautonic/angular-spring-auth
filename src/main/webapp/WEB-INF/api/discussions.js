var discussionList = module.singleton("discussionList", function() {
    //todo: replace image links with something less hardcoded
    return [{
        id: 1,
        title: "DISCUSSION TITLE 1",
        posts: [{
            id: 0,
            owner: {
                username: "bob101",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        },{
            id: 1,
            owner: {
                username: "anonymousUser",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        },{
            id: 2,
            owner: {
                username: "fred",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        }]
    },{
        id: 2,
        title: "DISCUSSION TITLE 2",
        posts: [{
            id: 0,
            owner: {
                username: "bob202",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        }]
    },{
        id: 3,
        title: "DISCUSSION TITLE 3",
        posts: [{
            id: 0,
            owner: {
                username: "bob303",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        }]
    }];
});

var httpclient = require('ringo/httpclient');
var {Headers} = require('ringo/utils/http');
var {encode} = require('ringo/base64');

var getDiscussion = function(id) {
    if(id == "new")
    {
        return {
            id: 0,
            title: "",
            posts: []
        }
    }

    var opts = {
        url: 'http://localhost:9300/myapp/api/posts/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);
    log.info("GET: exchange results: "+exchange.content);
    return {
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };

    //return discussionList[id-1];
}

var getDiscussionList = function() {
    var opts = {
        url: 'http://localhost:9300/myapp/api/posts/',
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return {
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };
}

var addReply = function(id, reply) {
    discussionList[id-1].posts.push(reply);
}

var log = require( 'ringo/logging' ).getLogger( module.id );

var createDiscussion = function(firstPost, username, password) {

    var data = {
        "dataType": "posts",
        "dateCreated": "",
        "parentId": null,
        "type": "discussion",
        "creator":{
            "_id": 1,
            "username": username,
            "profilePicture": { 'filepath': "/img/bob.com" }
        },
        "title": firstPost.title,
        "message": firstPost.posts[0].content,
        "ip": "10.16.151.115",
        "spam": 0,
        "likedBy": [],
        "likes": 0,
        "views":0,
        "active": true
    };

    var headers = Headers({"Authorization": generateBasicAuthorization(username, password), "x-rt-index" : 'gc', "Content-Type": "application/json"});

    /*(function() {
        var auth = getAuthentication();
        return auth ? getAuthorizationHeader(auth) : '';
    })();*/

    var opts = {
        url: 'http://localhost:9300/myapp/api/posts/',
        method: 'POST',
        data: JSON.stringify(data),
        headers: headers,
        async: false
    };

    var exchange = httpclient.request(opts);

    log.info("exchange content: "+exchange.content);

    return JSON.parse(exchange.content).parentId;
}


function generateBasicAuthorization(username, password) {
    log.debug("Hash Pass?: " + password)
    var header = username + ":" + password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}

var editDiscussionPost = function(id, postId, postContent) {
    discussionList[id-1].posts[postId] = postContent;
}

export('getDiscussion', 'getDiscussionList', 'addReply', 'createDiscussion', 'editDiscussionPost');