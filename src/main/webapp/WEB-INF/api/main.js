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
var {ajax, searchAllArticles, getAllArticles, getArticlesByCategory, getArticle, linkDiscussionToArticle, returnRandomQuote} = require('articles');
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

/********** Articles and resources *********/

app.get('/article/all/news', function(req) {
    return articles(req, "articles", 3);
})

/* Attempt to allow for sorting by type. didn't quite work */
/*app.get('/article/all/:type', function(req, type) {
    return articles(req, type);
});*/

app.get('/article/all', function(req) {
    return articles(req, 'articles');
});

function articles(req, type, max) {
    var articles = getAllArticles(type, max);

    if(articles.success) {
        return json(articles.content);
    }
    return json(false);
}

app.get('/article/search', function(req) {
    var articles = searchAllArticles(req.params);

    return json(articles);
})

app.get('/article/all/bycategory/:category', function(req, category) {
    var articles = getArticlesByCategory(category);

    if(articles.success) {
        return json(articles.content);
    }
    return json(false);
});

app.get('/article/:id', function(req, id) {
    var article = getArticle(id);

    if(article.success) {
        var servletRequest = req.env.servletRequest;
        if( (article.content.premium) && (!servletRequest.isUserInRole('ROLE_ADMIN')) )
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
        return {
            status:404,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
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
    var discussions = getDiscussionList().content;

    discussions.forEach(function(discussion) {
        if(discussion.parentId) {
            var linked = getArticle(discussion.parentId);

            if(linked) {
                discussion.linkedItem = linked.content;
                discussion.linkedItem.exists = true;
            } else {
                discussion.linkedItem = { "exists": false };
            }
        } else {
            discussion.linkedItem = { "exists": false };
        }
    });

    return json(discussions);
});

/**
 * Returns a single discussion, in threaded format
 */
app.get('/discussions/:id', function(req, id) {
    var result = getDiscussion(id);

    if(!result.success) {
        return {
            status:404,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
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
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
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

        //log.info('Activity stream returned from Zocia: {}', JSON.stringify(stream, null, 4));

        var activities = [];
        stream.acts.forEach(function (activity) {
            activity = new ActivityMixin(activity, req, ctx('/'), profile.principal.id);

            if (activity.description !== null) {

                // Assign values from the mixin to a temp object, since the mixin won't be passed via JSON
                activities.push({
                    'thumbnailUrl': activity.thumbnailUrl,
                    'fullName': activity.fullName,
                    'username': activity.props.actor.username,
                    'message': activity.description,
                    'dateCreated': activity.props.dateCreated,
                    'isOwner': activity.isOwner,
                    'profileId': activity.profileId
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
        "password" : digest(req.postParams.password).toLowerCase(),
        "accountEmail" : {
            "address"  : req.postParams.accountEmail.address
        },
        "workHistory" : req.postParams.workHistory,
        "thumbnail": req.postParams.thumbnail
    };


    data.source = 'GC';
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
    var user = getUserDetails();
    var userCanEdit;

    log.info('Current user details {}', JSON.stringify(user, null, 4));

    if(user.roles[0] === "role_anonymous"){
        userCanEdit = false;
    }

    if(user.principal.id === id){
        userCanEdit = true;
    }

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

    result.content.userCanEdit = userCanEdit;
    result.content.isUserFollowing = isUserFollowing(result.content._id);
    result.content.facultyFellow = result.content.roles.some(function(role) {
        return role == "ROLE_PREMIUM";
    });

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

    var profileExchange = httpclient.request(opts);

    var profiles = JSON.parse(profileExchange.content);

    // grab the latest activity for each profile that was done by the user before sending on
    // to angular
    profiles.forEach(function(profile){
        var filters = "likes comments discussions collaborators ideas companies profiles spMessages";
        var filteredActivities = 'likes comments discussions collaborators ideas companies profiles spMessages';
        var allowedActivities = filters.trim().split(' ');

        //remove terms that are not in the active filter list
        allowedActivities.forEach(function(activity) {
            filteredActivities = filteredActivities.replace(activity, '');
        });

        var url = 'http://localhost:9300/myapp/api/activities/byactor/' + profile._id;

        var opts = {
            url: url,
            method: 'GET',
            headers: Headers({ 'x-rt-index': 'gc' }),
            async: false
        }

        // Make the AJAX call to get the result set, pagination included, with filtering tacked on the end.
        var activityExchange = httpclient.request(opts);

        var stream = JSON.parse(activityExchange.content);

        var latestActivity;

        log.info('Activity stream for {}: {}', profile.username, JSON.stringify(stream, null, 4));

        // find the latest activity directly taken by the owner of the profile
        // the latest activity is the last activity in the array
        var activity = new ActivityMixin(stream.pop(), req, ctx('/'), undefined);

        latestActivity = {
            'fullName': activity.fullName,
            'message': activity.description,
            'dateCreated': activity.props.dateCreated
        }

        profile.activity = latestActivity;

        profile.isUserFollowing = isUserFollowing(profile._id);

        profile.facultyFellow = profile.roles.some(function(role) {
            return role == "ROLE_PREMIUM";
        });
    });

    var result = json({
        'status': profileExchange.status,
        'content': profiles,
        'headers': profileExchange.headers,
        'success': Math.floor(profileExchange.status / 100) === 2
    });

    result.status = profileExchange.status;

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
        "thumbnail": req.postParams.thumbnail,
        "about": req.postParams.about
    };

    if(req.postParams.newPass && req.postParams.newPass !== ''){
        data.password = digest(req.postParams.newPass).toLowerCase();
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
                    //'x-rt-upload-size': params.size
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

    //return json({ response: JSON.parse(exchange.content) });

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    return result
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

/***********************
 *
 * Utility Functions
 *
 ***********************/

// gets a random quote, used on the homepage. quotes are currently placeholders
app.get('/utility/getquote', function(req) {
    return json({ "quote": returnRandomQuote() });
})

// incriments view count for an object
app.post('/utility/view/:id', function(req, id) {
    var opts = {
        url: "http://localhost:9300/myapp/api/views/" + id,
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
})

app.post('/utility/like/:id', function(req, id) {
    var user = getUserDetails();

    var opts = {
        url: "http://localhost:9300/myapp/api/likes/" + user.principal.id + "/" + id,
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
})

/**
 * Requires an email address, and passes that to zocia. If the email address is valid/in use, it will send the user an email giving them a link to reset their password using the token that's generated
 */
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

    return result;
});

/**
 * This actually performs the action of resetting the password, given the token from the previous function. Generates a new password, sending it via email, that the user can then use to login
 */
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

    return result;
});

app.post('/utility/verifyprofile', function(req){
    var params = req.postParams;
    log.info('Profile id {}', params.profileId);

    var opts = {
        url: 'http://localhost:9300/myapp/api/email/resendverifyprofile/' + params.profileId,
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

app.get('/utility/verifyemail/:token', function(req, token){
    var opts = {
        url: 'http://localhost:9300/myapp/api/email/verifyprofile/' + token,
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

app.post('/utility/sendusername/:email', function(req, email){
    var opts = {
        url: 'http://localhost:9300/myapp/api/email/sendusername/' + email,
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

// GCEE global search
app.post('/search/site/', function(req){
    var url = 'http://localhost:9300/myapp/api/search/';

    log.info('Request params {}', JSON.stringify(req.postParams, null, 4));
    var dataType = 'posts,resources,profiles';

    if(req.postParams.dataType){
        dataType = req.postParams.dataType;
    }

    var queryParams = [
        'q=' + encodeURIComponent(req.postParams.q),
        'from=' + 0,
        'size=' + 30,
        'sort=' + 'desc',
        'sortField=' + 'dateCreated',
        'dataType=' + dataType
    ];

    url += '?' + queryParams.join('&');

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    // this request will return raw elasticsearch query results, so we'll need to run
    // it through a little logic to get what we want
    var gceeExchange = httpclient.request(opts);

    var gceeObjects = JSON.parse(gceeExchange.content);

    // we'll be using  the raw elasticsearch result facets
    var facets = gceeObjects.facets;

    // we're really only interested in the hits property of the hits object returned from
    // the query
    gceeObjects = gceeObjects.hits.hits;

    // filters out threads with empty titles and threads that are tied to an article
    // this basically leaves us with post parents and no replies
    gceeObjects = gceeObjects.filter(function(object) {
        return !(object._source.title === "" && object._source.dataType === 'posts');
    });

    // We need to take the discussion and profile objects returned from Zocia and modify
    // them slightly
    gceeObjects.forEach(function(object){
        //log.info('GCEE object returned from Zocia {}', JSON.stringify(object, null, 4));
        // We have to get last activity information for each profile
        if(object._source.dataType === 'profiles'){
            var filters = "likes comments discussions collaborators ideas companies profiles spMessages";
            var filteredActivities = 'likes comments discussions collaborators ideas companies profiles spMessages';
            var allowedActivities = filters.trim().split(' ');

            //remove terms that are not in the active filter list
            allowedActivities.forEach(function(activity) {
                filteredActivities = filteredActivities.replace(activity, '');
            });

            var url = 'http://localhost:9300/myapp/api/activities/byactor/' + object._id;

            var opts = {
                url: url,
                method: 'GET',
                headers: Headers({ 'x-rt-index': 'gc' }),
                async: false
            }

            // Make the AJAX call to get the result set, pagination included, with filtering tacked on the end.
            var activityExchange = httpclient.request(opts);

            var stream = JSON.parse(activityExchange.content);

            var latestActivity;

            // find the latest activity directly taken by the owner of the profile
            var activity = new ActivityMixin(stream[0], req, ctx('/'), undefined);

            latestActivity = {
                'fullName': activity.fullName,
                'message': activity.description,
                'dateCreated': activity.props.dateCreated
            }

            object._source.activity = latestActivity;

            object._source.facultyFellow = object._source.roles.some(function(role) {
                return role == "ROLE_PREMIUM";
            });
        }

        // We have to get the number of comments for each discussion object
        if(object._source.dataType === 'posts'){
            log.info('Filtered discussion object {}', JSON.stringify(object._source, null, 4));

            var opts = {
                url: 'http://localhost:9300/myapp/api/posts/byentities/count?ids[]=' + object._id + '&types=discussion',
                method: 'GET',
                headers: Headers({ 'x-rt-index': 'gc' }),
                async: false
            };

            var discussionExchange = httpclient.request(opts);

            var comment = JSON.parse(discussionExchange.content);

            object._source.commentCount = comment.count;
        }
        if(object._source.dataType === 'resources') {
            object.premium = (object._source.roles.some(function(element) { return element == "ROLE_PREMIUM"; }));
        }
    });

    var result = json({
        'status': gceeExchange.status,
        'content': gceeObjects,
        'facets': facets.dataTypes.terms,
        'headers': gceeExchange.headers,
        'success': Math.floor(gceeExchange.status / 100) === 2
    });

    result.status = gceeExchange.status;

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

    var profileExchange = httpclient.request(opts);

    var profiles = JSON.parse(profileExchange.content).hits.hits;
    log.info("PROFILES? "+JSON.stringify(profiles._source));
    // grab the latest activity for each profile that was done by the user before sending on
    // to angular
    profiles.forEach(function(profile){
        var filters = "likes comments discussions collaborators ideas companies profiles spMessages";
        var filteredActivities = 'likes comments discussions collaborators ideas companies profiles spMessages';
        var allowedActivities = filters.trim().split(' ');

        //remove terms that are not in the active filter list
        allowedActivities.forEach(function(activity) {
            filteredActivities = filteredActivities.replace(activity, '');
        });

        var url = 'http://localhost:9300/myapp/api/activities/byactor/' + profile._source._id;

        var opts = {
            url: url,
            method: 'GET',
            headers: Headers({ 'x-rt-index': 'gc' }),
            async: false
        }

        // Make the AJAX call to get the result set, pagination included, with filtering tacked on the end.
        var activityExchange = httpclient.request(opts);

        var stream = JSON.parse(activityExchange.content);

        var latestActivity;

        log.info('Activity stream for {}: {}', profile._source.username, JSON.stringify(stream, null, 4));

        // find the latest activity directly taken by the owner of the profile
        var activity = new ActivityMixin(stream[0], req, ctx('/'), undefined);

        latestActivity = {
            'fullName': activity.fullName,
            'message': activity.description,
            'dateCreated': activity.props.dateCreated
        }

        profile._source.activity = latestActivity;

        profile._source.facultyFellow = profile._source.roles.some(function(role) {
            return role == "ROLE_PREMIUM";
        });
    });

    var result = json({
        'status': profileExchange.status,
        'content': profiles,
        'headers': profileExchange.headers,
        'success': Math.floor(profileExchange.status / 100) === 2
    });

    result.status = profileExchange.status;

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

    log.info('Search discussions url {}', url);

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    //filters out threads with empty titles and threads that are tied to an article
    var threads = JSON.parse(exchange.content).filter(function(element) {
        return !(element.title === "");
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

        var comment = JSON.parse(exchange.content);

        thread.commentCount = comment.count;
    });

    console.log('EXCHANGE STATUS!!! ', exchange.status);

    var result = json({
        'status': exchange.status,
        'content': threads,
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



