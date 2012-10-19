/**
 * @fileOverview Entry point for all web calls
 */
var httpclient = require('ringo/httpclient');

var fileUpload = require('ringo/utils/http');

var {Headers} = fileUpload;

var log = require( 'ringo/logging' ).getLogger( module.id );
var {trimpath, trimpathResponse, registerHelper} = require( 'trimpath' );
var {json} = require( 'ringo/jsgi/response' );
var {digest} = require('ringo/utils/strings');

var {Application} = require( 'stick' );
var {ajax, getAllArticles, getArticlesByCategory, getArticle, linkDiscussionToArticle, returnRandomQuote} = require('articles');
var {getDiscussion, getDiscussionByParent, getDiscussionList, addReply, createDiscussion, editDiscussionPost} = require('discussions');
var {ActivityMixin} = require('activities');

var {encode} = require('ringo/base64');

var app = exports.app = Application();
app.configure( 'notfound', 'params', 'mount', 'route' );

app.mount('/cms', require('./cms'));
app.mount('/seedcms', require('./seedcms'));


registerHelper( {
	include: function ( path, context ) {
		return trimpath( path );
	},
	ctx: function ( url ) {
		return ctx( url );
	}
} );

function ctx( url ) {
	// Only prepend the context path if the URL is a relative
	if ( /^\//.test( url ) ) {
		var req = getRequest();
		if ( !req ) {
			throw 'Function ctx requires a request object to be known to the application.';
		}

		// Get the servlet's context path
		var contextPath = req.env.servletRequest.contextPath;
		url = contextPath + url;
	}
	return url;
}

function getRequest() {
	var app = require( module.resolve( 'main' ) ).app;
	if ( app ) return app.request;
	return null;
}


/************************
 *
 * Website Get/Post functions
 *
 ************************/

app.get( '/', function ( req ) {
	return homepage( req );
} );

app.get( '/index.html', function ( req ) {
	return homepage( req );
} );

app.get('/getquote', function(req) {
    return json({ "quote": returnRandomQuote() });
})

/********** Articles and resources *********/

/* Attempt to allow for sorting by type. didn't quite work */
app.get('/article/all/:type', function(req, type) {
    return articles(req, type);
});

app.get('/article/all', function(req) {
    return articles(req, 'articles');
});

function articles(req, type) {
    var articles = getAllArticles(type);

    if(articles.success) {
        return json(articles.content);
    }
    return json(false);
}

app.get('/article/all/bycategory/:category', function(req, category) {
    var articles = getArticlesByCategory(category);

    if(articles.success) {
        return json(articles.content);
    }
    return json(false);
})

app.get('/article/:id', function(req, id) {
    var article = getArticle(id);

    if(article.success) {
        var servletRequest = req.env.servletRequest;
        if(!servletRequest.isUserInRole('ROLE_ADMIN'))
        {
            log.info("User does not have access to full article content.");
            delete article.content.content;
        } else {
            log.info("Full article content should be returned");
            //todo: make this replacement actually replace things properly. this solution is not feasible for long term
            /*var newUrl = "http://localhost:8080" + ctx("/#/article/");

             article.content = article.content.replace(new RegExp("http://example.com/blog/article-title-"), newUrl.toString());*/
        }

        return json(article.content);
    } else {
        return json(false);
    }
});

app.post('/article/new', function(req) {
    var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    var auth = SecurityContextHolder.context.authentication;

    var servletRequest = req.env.servletRequest;
    if(servletRequest.isUserInRole('ROLE_ADMIN'))
    {
        return {
            status:400,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    //at this point we need to send the post content to the zocia server and specifically the wordpress thing
});

/********** Discussion posts *********/

/**
 * Returns a list of discussion topics
 */
app.get('/discussions/all', function(req, id) {
    return json(getDiscussionList().content);
});

/**
 * Returns a single discussion, in threaded format
 */
app.get('/discussions/:id', function(req, id) {
    var result = getDiscussion(id);

    if(!result.success) {
        return json(false);
    }

    return json(result.content);
});

app.get('/discussions/byParent/:id', function(req, id) {
    var result = getDiscussionByParent(id);

    if(!result.success) {
        return json(false);
    }

    return json(result.content);
});

/**
 * Edits a discussion post
 */
app.put('/discussions/:id/:post', function(req, id, post) {
    var editedPost = req.params;

    return json(editDiscussionPost(id, post, editedPost, getUserDetails()));
});

/**
 * Creates a new discussion topic
 */
app.post('/discussions/new', function(req) {
    var discussion = req.params;

    if(typeof discussion == "array")
    {
        discussion = discussion["0"];
    }

    var result = createDiscussion(discussion, getUserDetails());

    if(result != false) {
        if(result.title !== "") {
            return json({ "newId" : result.threadId });
        } else {
            return json({ "success": true });
        }
    }

    return json(false);
});

/**
 * Reply to a discussion
 */
app.post('/discussions/:id', function(req, id) {
    var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    var auth = SecurityContextHolder.context.authentication;

    var servletRequest = req.env.servletRequest;
    if(servletRequest.isUserInRole('ROLE_ANONYMOUS'))
    {
        return json(false);
    }

    return json(addReply(id, req.params.reply, getUserDetails()));
});
/****** End discussion posts ********/

app.get('/notifications', function(req) {
    var params = req.params;

    // Get user profile obj
    var profile = getUserDetails();
    if(profile.principal.id === undefined) {
        log.info("User not found or not logged in. Exiting");
        return json({
            itemCount: 0,
            currentPage: 0,
            items: []
        });
    }
    // Get info for paginated results
    var page = isNaN(params.page) ? '1' : params.page;
    var size = isNaN(params.pageSize) ? '10' : params.pageSize;
    var from = (page - 1) * size;

    // Due to the way "filtering" was set up server side, we have to invert what the front end gives us (unless we want to re-write the front end, which I don't at this point)
    var filteredActivities = 'likes comments discussions collaborators ideas companies profiles spMessages';
    var allowedActivities = params.filters.trim().split(' ');

    //remove terms that are not in the active filter list
    allowedActivities.forEach(function(activity) {
        filteredActivities = filteredActivities.replace(activity, '');
    });

    var url = 'http://localhost:9300/myapp/api/activities/streams/' + profile.principal.id + '?size=' + size + '&from=' + from + '&filters=' + filteredActivities.trim().replace(/ /g, ',');

    // Make the AJAX call to get the result set, pagination included, with filtering tacked on the end.
    var exchange = ajax(url);

    // Try to parse the results, wrap each activity in a mixin, then return a response
    try {
        var stream = exchange.content;
        var activities = [];     log.info("ACITIVITY STREAM IS: "+JSON.stringify(exchange.content));
        stream.acts.forEach(function (activity) {
            activity = new ActivityMixin(activity, req, ctx('/'));

            if (activity.description !== null) {

                // Assign values from the mixin to a temp object, since the mixin won't be passed via JSON
                activities.push({
                    'thumbnailUrl': activity.thumbnailUrl,
                    'username': activity.props.actor.username,
                    'message': activity.description,
                    'dateCreated': activity.props.dateCreated,
                    'isOwner': activity.isOwner
                });
            }
        });

        return json({
            itemCount: stream.total,
            currentPage: page,
            items: activities
        });
    } catch (e) {
        log.info("Error parsing activity stream: " + e.message);
        return json({
            itemCount: 0,
            currentPage: 0,
            items: []
        });
    }
});

app.get( '/ping', function ( req ) {
	var servletRequest = req.env.servletRequest;

	return json( {
		url: '/ping',
		user: servletRequest.isUserInRole( 'ROLE_USER' ),
		admin: servletRequest.isUserInRole( 'ROLE_ADMIN' ),
		anonymous: servletRequest.isUserInRole( 'ROLE_ANONYMOUS' )
	} );
} );

/************ Follow User functions *********/
//generally, the user ID and the ID of the thing he's following
app.post('/follow/:followedById/:entityId', function(req, followedById, entityId) {
    var user = getUserDetails();

    var opts = {
        url: 'http://localhost:9300/myapp/api/follow/' + followedById + "/" + entityId,
        method: 'POST',
        data: {},
        headers: Headers({ "Authorization": _generateBasicAuthorization(user.username, user.password), 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    }

    var exchange = httpclient.request(opts);

    return json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });
});

function isUserFollowing(id) {
    var user = getUserDetails();

    var opts = {
        url: 'http://localhost:9300/myapp/api/follow/' + user.principal.id + "/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    }

    var exchange = httpclient.request(opts);

    return (exchange.status === 200);
}

/**
 * Returns the authentication credentials for the current user using the Spring Security
 * classes.
 */
app.get( '/auth', function ( req ) {
    java.lang.Thread.sleep(1000);

	var result = getUserDetails();

    log.info("logging in user");
	return json( result );
} );

/********** Profile pages *********/
app.post('/profiles/', function(req){
    var data = {
        "username" : req.postParams.username,
        "name" : {
            "given": req.postParams.name.given,
            "pre": req.postParams.name.pre,
            "surname": req.postParams.name.surname
        },
        "password" : req.postParams.password,
        "accountEmail" : {
            "address"  : req.postParams.accountEmail.address
        },
        "websites" : req.postParams.websites,
        "workHistory" : req.postParams.workHistory,
        "educationHistory" : req.postParams.educationHistory,
        "thumbnail": req.postParams.thumbnail
    };

    data.source = 'test';
    data.accountEmail.status = 'unverified';

    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    log.info('NEW PROFILE CREATION: ', exchange.status);

    return json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });
});

app.get('/profiles/:id', function(req, id){
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = {
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };

    result.status = exchange.status;

    result.content.isUserFollowing = isUserFollowing(result.content._id);

    return json(result);
});

app.get('/profiles/', function(req){
    log.info('REQUEST PARAMS: ', JSON.stringify(req.params, null, 4));

    var url;

    if(req.params.email){
        url = 'http://localhost:9300/myapp/api/profiles/byprimaryemail/' + req.params.email;
    }else if(req.params.username){
        url = 'http://localhost:9300/myapp/api/profiles/byusername/' + req.params.username;
    }else{
        url = 'http://localhost:9300/myapp/api/profiles/';
    }

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.put('/profiles/:id', function(req, id){
    var auth = _generateBasicAuthorization('backdoor', 'Backd00r');

    var data = {
        "username" : req.postParams.username,
        "name" : {
            "given": req.postParams.name.given,
            "pre": req.postParams.name.pre,
            "surname": req.postParams.name.surname
        },
        "accountEmail" : {
            "address"  : req.postParams.accountEmail.address
        },
        "educationHistory" : req.postParams.educationHistory,
        "websites" : req.postParams.websites,
        "workHistory" : req.postParams.workHistory,
        "thumbnail": req.postParams.thumbnail
    };

    if(req.postParams.newPass !== ''){
        data.password = req.postParams.newPass;
    }

    delete data.newPass;
    delete data.newPassRepeat;

    log.info('PROFILE UPDATE PARAMS ' + JSON.stringify(req.postParams, null, 4));
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + id,
        method: 'PUT',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': auth}),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.del('/profiles/:id', function(req, id){
    var auth = _generateBasicAuthorization('backdoor', 'Backd00r');
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + id,
        method: 'DELETE',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': auth}),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.get('/profiles/byprimaryemail/:email', function(req, email){
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/byprimaryemail/' + email,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    return result;
});

app.get('/profiles/byusername/:username', function(req, username){
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/byusername/' + username,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    return result;
});

/**
 * @function
 * @name POST /images/upload
 * @description Uploads images to S3 via RoundTable
 * @param {JsgiRequest} request
 * @returns {JsgiResponse} An HTML <div> containing a JSON string with upload results
 */
app.post('/profiles/images/upload/', function (req) {
    log.info('!!!REQ OBJECT!!! {}', JSON.stringify(req.params, null, 4));

    var contentType = req.env.servletRequest.getContentType();

    if ((req.method === "POST" || req.method === "PUT") && fileUpload.isFileUpload(contentType)) {
        log.info('File pre-upload: ' + JSON.stringify(req.params, null, 4));

        var encoding = req.env.servletRequest.getCharacterEncoding();

        var params = {};

        fileUpload.parseFileUpload(req, params, encoding, fileUpload.BufferFactory);

        log.info('File uploaded: ' + JSON.stringify(params, null, 4));

        var exchange;

        if(params.file){
            var auth = _generateBasicAuthorization('backdoor', 'Backd00r');
            var opts = {
                "url": 'http://localhost:9300/myapp/api/files/upload/',
                "headers": {
                    'x-rt-index': 'gc',
                    'Authorization': auth,
                    'x-rt-upload-name': params.file.filename,
                    'x-rt-upload-content-type': params.file.contentType,
                    'x-rt-upload-size': params.size
                    //'x-rt-upload-title': ''	// This param was never set in "old" NEP
                },
                "data": params.file.value,
                "method": 'PUT'
            }

            java.lang.Thread.sleep(1000);

            exchange = httpclient.request(opts);

            var content = JSON.parse(exchange.content);

            log.info('UPLOAD EXCHANGE URI', JSON.stringify(content.uri, null, 4));

            if(exchange.status === 200 ){
                return {
                    status: 200,
                    headers: {
                        "Content-Type": "text/html"
                    },
                    body: [content.uri]
                }
            }else if(exchange.status === 401){
                return {
                    status: 401,
                    headers: {"Content-Type": 'text/html'},
                    body: []
                };
            }
        } else {
            log.info("Error uploading image to S3: " + exchange.content);

            return {
                status: 500,
                headers: {"Content-Type": 'text/html'},
                body: []
            };
        }
    }

    return {
        status:400,
        headers:{"Content-Type":'text/html'},
        body:[]
    };
});

app.post('/profiles/images/crop/', function (req) {
    var params = req.params;

    var auth = _generateBasicAuthorization('backdoor', 'Backd00r');

    var opts = {
        "url": 'http://localhost:9300/myapp/api/files/crop/' + params.assetKey,
        "headers": {
            'x-rt-index': 'gc',
            'Authorization': auth
        },
        "data": params,
        "method": 'PUT'
    }

    var exchange = httpclient.request(opts);

    log.info('IMAGE CROP RESPONSE: ', JSON.stringify(exchange.content, null, 4));

    return json({ response: JSON.parse(exchange.content) });
});

app.get('/profiles/images/', function(req, id){
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    /*var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });*/

    var profile = JSON.parse(exchange.content);

    if (!profile) return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    };

    if (profile.thumbnail) {
        var input = new java.io.FileInputStream(new java.io.File(profile.thumbnail));
        var out = req.env.servletResponse.outputStream;

        var buffer = new ByteArray(1024);
        var len = input.read(buffer);
        while (len != -1) {
            out.write(buffer, 0, len);
            len = input.read(buffer);
        }
        out.close();
        input.close();

        return {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'X-JSGI-Skip-Response': 'true'
            },
            body: []
        };
    }

    return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    }
});

app.post('/utility/resettoken/', function(req){
    var data = req.postParams;
    data.callback = 'http://localhost:9300/myapp/api/';

    log.info('SEND PASSWORD POST DATA!!! ', JSON.stringify(data, null, 4));

    var opts = {
        url: 'http://localhost:9300/myapp/api/email/resettoken',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.post('/utility/resetpassword/', function(req){
    var data = req.postParams;

    var opts = {
        url: 'http://localhost:9300/myapp/api/email/resetpassword',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

// GCEE global search
app.post('/search/site/', function(req){
    var url = 'http://localhost:9300/myapp/api/search/';

    var queryParams = [
        'q=' + encodeURIComponent(req.postParams.q),
        'from=' + 0,
        'size=' + 30,
        'sort=' + 'desc',
        'sortField=' + 'dateCreated',
        'dataType=' + 'posts,resources,profiles'
    ];

    url += '?' + queryParams.join('&');

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.post('/search/faculty/', function(req){
    var url = 'http://localhost:9300/myapp/api/search/';

    var queryParams = [
        'q=' + encodeURIComponent(req.postParams.q),
        'from=' + 0,
        'size=' + 30,
        'sort=' + 'desc',
        'sortField=' + 'dateCreated',
        'dataType=' + 'profiles'
    ];

    url += '?' + queryParams.join('&');

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.post('/search/content/', function(req){
    var url = 'http://localhost:9300/myapp/api/search/';

    var queryParams = [
        'q=' + encodeURIComponent(req.postParams.q),
        'from=' + 0,
        'size=' + 30,
        'sort=' + 'desc',
        'sortField=' + 'dateCreated',
        'dataType=' + 'resources'
    ];

    url += '?' + queryParams.join('&');

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.post('/search/discussions/', function(req){
    var url = 'http://localhost:9300/myapp/api/search/';

    var queryParams = [
        'q=' + encodeURIComponent(req.postParams.q),
        'from=' + 0,
        'size=' + 30,
        'sort=' + 'desc',
        'sortField=' + 'dateCreated',
        'dataType=' + 'posts'
    ];

    url += '?' + queryParams.join('&');

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

/************************
 *
 * Admin functions
 *
 ************************/
app.get('/admin/users', function(req) {
    var url = 'http://localhost:9300/myapp/api/profiles/';

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
});

app.put('/admin/users', function(req) {
    var auth = _generateBasicAuthorization('backdoor', 'Backd00r');

    var data = {
        "username" : req.postParams.username,
        "name" : {
            "fullName": req.postParams.name.fullName
        },
        "accountEmail" : {
            "address"  : req.postParams.accountEmail.address
        },
        "workHistory" : req.postParams.workHistory
    };

    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + req.postParams._id,
        method: 'PUT',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': auth}),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
})

/************************
 *
 * Page functions
 *
 ************************/

function homepage( req ) {
	return json( {homepage: true} );
}

/*
Utility functions
*/

function _generateBasicAuthorization(username, password) {
	var header = username + ":" + password;
	var base64 = encode(header);
	return 'Basic ' + base64;
}

function getUserDetails() {
    var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    var auth = SecurityContextHolder.context.authentication;

    // principal can be a simple string or a spring security user object
    //todo setup so that auth.principal doesn't fail if it ever happens to be a string (test to see if it's ever a string)
    var principal = (typeof auth.principal === 'string') ? auth.principal : auth.principal;

    var result = {
        principal: {
            id: principal.id,
            username: principal.username,
            name: principal.name,
            email: principal.email,
            country: principal.country,
            profileType: principal.profileType,
            accountType: principal.accountType,
            thumbnail: principal.thumbnail
        },
        username: principal.username,
        "password": digest("secret").toLowerCase(),
        roles: []
    };

    var authorities = auth.authorities.iterator();
    while ( authorities.hasNext() ) {
        var authority = authorities.next();
        result.roles.push( authority.toString().toLowerCase() );
    }

    if(result.principal.thumbnail === 'profiles-0000-0000-0000-000000000001' ||
        result.principal.thumbnail === ''){
        result.principal.thumbnail = 'images/GCEE_image_profileMale_135x135.jpeg';
    }

    return result;
}



