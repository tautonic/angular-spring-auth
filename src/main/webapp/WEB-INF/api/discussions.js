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
        url: "http://localhost:9300/myapp/api/posts/" + id + "/threads",
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(Math.floor(exchange.status / 100) !== 2) {
        return {
            'status': 404,
            'content': JSON.parse(exchange.status),
            'headers': exchange.headers,
            'success': Math.floor(exchange.status / 100) === 2
        }
    }

    var thread = JSON.parse(exchange.content);

    thread[0].commentCount = countComments(thread[0]);

    thread[0].children.forEach(function(comment) {
        comment.hidden = (comment.spam >= 3);
    });

    return {
        'status': exchange.status,
        'content': thread,
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };
};

var getDiscussionByParent = function(parentId) {
    var query = {
        "query": {
            "bool": {
                "must":[
                    { "field": { "parentId": parentId } }
                ]
            }
        },
        "sort": [ { "dateCreated": "desc" } ]
    };

    var opts = {
        url: "http://localhost:9300/myapp/api/posts/search",
        method: 'POST',
        data: JSON.stringify(query),
        headers: Headers({ "x-rt-index": "gc", "Content-Type": "application/json" }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = JSON.parse(exchange.content);
    var threadId;

    if(result.length > 0) {
        result = result[0];
        threadId = result.threadId;
    } else {
        threadId = "new";
    }

    return getDiscussion(threadId);
};

var getDiscussionList = function() {
    var opts = {
        url: 'http://localhost:9300/myapp/api/posts/',
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    //this mostly filters discussions that don't have titles, which mostly relates to replies on discussions
    var threads = JSON.parse(exchange.content).filter(function(element) {
        return !(element.title === "");
    });

    //filters out spam threads
    threads.forEach(function(element) {
        element.hidden = (element.spam >= 3);
    });

    //loop through each thread and add an attribute that contains the
    //number of replies/comments
    threads.forEach(function(thread){
        opts = {
            url: 'http://localhost:9300/myapp/api/posts/byentities/count?ids[]=' + thread._id + '&types=discussion',
            method: 'GET',
            headers: Headers({ 'x-rt-index': 'gc' }),
            async: false
        };

        exchange = httpclient.request(opts);

        thread.commentCount = JSON.parse(exchange.content).count;//countComments(thread);
    });


    return {
        'status': exchange.status,
        'content': threads,
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };
};

var addReply = function(parentId, reply, user) {
    var data = {
        "dataType": "posts",
        "dateCreated": "",
        "threadId": reply.id,
        "type": "discussion",
        "creator":{
            "_id": user.principal.id,
            "username": user.username,
            "profilePicture": { 'filepath': user.principal.thumbnail }
        },
        "title": reply.title,
        "message": reply.reply,
        "ip": "10.16.151.115",
        "spam": 0,
        "likedBy": [],
        "likes": 0,
        "views":0,
        "active": true
    };

    var headers = Headers({"Authorization": generateBasicAuthorization(user), "x-rt-index" : 'gc', "Content-Type": "application/json"});

    var opts = {
        url: 'http://localhost:9300/myapp/api/posts/'+reply.id,
        method: 'POST',
        data: JSON.stringify(data),
        headers: headers,
        async: false
    };

    var exchange = httpclient.request(opts);

    return JSON.parse(exchange.content);
};

var log = require( 'ringo/logging' ).getLogger( module.id );

var createDiscussion = function(firstPost, user) {

    var data = {
        "dataType": "posts",
        "dateCreated": "",
        "parentId": firstPost.parentId,
        "type": "discussion",
        "creator":{
            "_id": user.principal.id,
            "username": user.username,
            "profilePicture": { 'filepath': user.principal.thumbnail }
        },
        "title": (firstPost.title || ''),
        "message": firstPost.posts[0].message,
        "ip": "10.16.151.115",
        "spam": 0,
        "likedBy": [],
        "likes": 0,
        "views":0,
        "active": true
    };

    var url = 'http://localhost:9300/myapp/api/posts/';
    if(firstPost.parentId !== null) {
        url += firstPost.parentId.toString();
    }
    var headers = Headers({"Authorization": generateBasicAuthorization(user), "x-rt-index" : 'gc', "Content-Type": "application/json"});

    var opts = {
        url: url,
        method: 'POST',
        data: JSON.stringify(data),
        headers: headers,
        async: false
    };

    var exchange = httpclient.request(opts);

    log.info("creating new discussion: exchange content: "+exchange.content);
    if(Math.floor(exchange.status/100) === 2)
    {
        return JSON.parse(exchange.content);
    }

    return false;
};

var editDiscussionPost = function(id, postId, postContent, user) {

    var data = {
        "dataType": "posts",
        "dateCreated": postContent.dateCreated,
        "parentId": postContent.parentId,
        "type": "discussion",
        "creator": postContent.creator,
        "title": postContent.title,
        "message": postContent.message,
        "ip": postContent.ip,
        "spam": postContent.spam,
        "likedBy": postContent.likedBy,
        "likes": postContent.likes,
        "views":postContent.views,
        "active": postContent.active
    };

    var headers = Headers({"Authorization": generateBasicAuthorization(user), "x-rt-index" : 'gc', "Content-Type": "application/json"});

    var opts = {
        url: 'http://localhost:9300/myapp/api/posts/'+postId,
        method: 'PUT',
        data: JSON.stringify(data),
        headers: headers,
        async: false
    };

    var exchange = httpclient.request(opts);

    return (Math.floor(exchange.status/100) === 2);
};

function countComments(post) {
    var length = post.children.length;
    for(var i = 0; i < post.children.length; i++) {
        length += countComments(post.children[i]);
    }

    return length;
}

function generateBasicAuthorization(user) {
    log.debug("Hash Pass?: " + user.password);
    var header = user.username + ":" + user.password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}

export('getDiscussion', 'getDiscussionByParent', 'getDiscussionList', 'addReply', 'createDiscussion', 'editDiscussionPost');