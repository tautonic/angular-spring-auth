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
var {getDiscussion, getDiscussionByParent, getDiscussionList, addReply, createDiscussion, editDiscussionPost, deletePost} = require('discussions');
var {convertActivity, getLatestActivity} = require('activities');
var {getZociaUrl} = require('utility/getUrls');

var {encode} = require('ringo/base64');

var app = exports.app = Application();
app.configure( 'error', 'notfound', 'params', auth, 'mount', 'route' );

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
});

app.get('/article/all', function(req) {
    return articles(req, 'articles');
});

function articles(req, type, max) {
    var articles = getAllArticles(req, type, max);

    if(articles.success) {
        return json(articles.content);
    }
    return json(false);
}

app.get('/article/search', function(req) {
    var articles = searchAllArticles(req, req.params);

    return json(articles);
});

app.get('/article/all/bycategory/:category', function(req, category) {
    var articles = getArticlesByCategory(req, category);

    if(articles.success) {
        return json(articles.content);
    }
    return json(false);
});

app.get('/article/:id', function(req, id) {
    var article = getArticle(req, id);

    if(article.success) {
        var servletRequest = req.env.servletRequest;
        if( (article.content.premium) && !((servletRequest.isUserInRole('ROLE_PREMIUM')) || (servletRequest.isUserInRole('ROLE_ADMIN')) ))
        {
            delete article.content.content;
        } else {
            //todo: make this replacement actually replace things properly. this solution is not feasible for long term
            /*var newUrl = "http://localhost:8080" + ctx("/#/article/");

             article.content = article.content.replace(new RegExp("http://example.com/blog/article-title-"), newUrl.toString());*/
        }

        // Before we pass the article on to angular, let's get the thumbnail of the author
        var opts = {
            url: getZociaUrl(req) + '/profiles/byusername/' + article.content.author,
            method: 'GET',
            headers: Headers({ 'x-rt-index': 'gc',
                'Content-Type': 'application/json'}),
            async: false
        };

        var author = _simpleHTTPRequest(opts);
        author = JSON.parse(author.body[0]);
        if(author.content.thumbnail === 'profiles-0000-0000-0000-000000000001'){
            author.content.thumbnail = 'images/GCEE_image_defaultMale.jpeg';
        }
        article.content.authorThumb = author.content.thumbnail;

        return json(article.content);
    } else {
        return {
            status:404,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }
});

app.post('/admin/articles', function(req){
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {     
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    req.postParams.format = 'article';
    req.postParams.locale = 'en';
    delete req.postParams.premium;

    var opts = {
        url: getZociaUrl(req) + '/resources/',
        method: 'POST',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.put('/admin/articles/:id', function(req, id){
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    delete req.postParams.doctype;
    delete req.postParams.premium;

    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'PUT',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.del('/admin/articles/:id', function(req, id){
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'DELETE',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

/********** Discussion posts *********/

/**
 * Returns a list of discussion topics
 */
app.get('/discussions/all', function(req) {
    var discussions = getDiscussionList(req, req.params).content;

    discussions.forEach(function(discussion) {
        if(discussion.parentId) {
            var linked = getArticle(req, discussion.parentId);

            if(linked) {
                discussion.linkedItem = linked.content;
                discussion.linkedItem.exists = true;
                discussion.commentCount = linked.content.comments;
                discussion.link = "#/content/view/" + linked.content._id;
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
    var result = getDiscussion(req, id, req.params);

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
    var result = getDiscussionByParent(req, id, req.params);

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

    return json(editDiscussionPost(req, id, post, editedPost));
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

    var result = createDiscussion(req, discussion);

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
    var servletRequest = req.env.servletRequest;
    if(servletRequest.isUserInRole('ROLE_ANONYMOUS'))
    {
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    return json(addReply(req, req.params));
});

app.del('/discussions/:id', function(req, id) {
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    if(req.params.threadId === id) {
        var thread = getDiscussion(req, id).content[0];

        thread.children.forEach(function(post) {
            deletePost(req, post._id);
        });
    }

    return json(deletePost(req, id));
});
/****** End discussion posts ********/

app.get('/notifications', function(req) {
    var params = req.params;

    if(req.auth.principal.id === undefined) {
        return json({
            itemCount: 0,
            currentPage: 0,
            items: []
        });
    }
    // Get info for paginated results
    var from = isNaN(params.from) ? '1' : params.from;
    var size = isNaN(params.size) ? '10' : params.size;

    // Due to the way "filtering" was set up server side, we have to invert what the front end gives us (unless we want to re-write the front end, which I don't at this point)
    var filteredActivities = 'likes comments discussions collaborators ideas companies profiles spMessages';
    var allowedActivities = params.filters.trim().split(' ');

    //remove terms that are not in the active filter list
    allowedActivities.forEach(function(activity) {
        filteredActivities = filteredActivities.replace(activity, '');
    });

    var url = getZociaUrl(req) + '/activities/streams/' + req.auth.principal.id + '?size=' + size + '&from=' + from + '&filters=' + filteredActivities.trim().replace(/ /g, ',');

    // Make the AJAX call to get the result set, pagination included, with filtering tacked on the end.
    var exchange = ajax(url);

    // Try to parse the results, wrap each activity in a mixin, then return a response
    try {
        var stream = exchange.content;

        //log.info('Activity stream returned from Zocia: {}', JSON.stringify(stream, null, 4));

        var activities = [];
        stream.acts.forEach(function (activity) {
            activity = convertActivity(activity, req, ctx('/'), req.auth.principal.id);

            if (activity !== null) {
                // Assign values from the mixin to a temp object, since the mixin won't be passed via JSON
                activities.push(activity);
            }
        });

        return json({
            itemCount: stream.total,
            items: activities
        });
    } catch (e) {
        log.info("Error parsing activity stream: " + e.message);
        return json({
            itemCount: 0,
            items: []
        });
    }
});

app.get( '/ping', function ( req ) {
	return json( {
		url: '/ping',
		user: req.auth.isUserInRole( 'ROLE_USER' ),
		admin: req.auth.isUserInRole( 'ROLE_ADMIN' ),
		anonymous: req.auth.isUserInRole( 'ROLE_ANONYMOUS' )
	} );
} );

/************ Follow User functions *********/
//generally, the user ID and the ID of the thing he's following
app.post('/follow/:followedById/:entityId', function(req, followedById, entityId) {
    var opts = {
        url: getZociaUrl(req) + '/follow/' + followedById + "/" + entityId,
        method: 'POST',
        data: {},
        headers: Headers({ "Authorization": _generateBasicAuthorization('backdoor', 'Backd00r'), 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.del('/follow/:followedById/:entityId', function(req, followedById, entityId) {
    var opts = {
        url: getZociaUrl(req) + '/follow/' + followedById + "/" + entityId,
        method: 'DELETE',
        data: {},
        headers: Headers({ "Authorization": _generateBasicAuthorization('backdoor', 'Backd00r'), 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.get('/following/:userId', function(req, userId, params) {
    var opts = {
        url: getZociaUrl(req) + '/follow/byUser/' + userId,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(Math.floor(exchange.status / 100) === 2) {
        var following = [];
        var list = JSON.parse(exchange.content);
        list.forEach(function(follow) {
            following.push(getUser(req, follow.entityId));
        });

        return json({
            following: following,
            success: true
        });
    }

    return json({
        following: [],
        success: false
    });
});

app.get('/followers/:userId', function(req, userId, params) {
    var opts = {
        url: getZociaUrl(req) + '/follow/byEntity/' + userId,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(Math.floor(exchange.status / 100) === 2) {
        var followers = [];
        var list = JSON.parse(exchange.content);
        list.forEach(function(follow) {
            followers.push(getUser(req, follow.followedById));
        });

        return json({
            followers: followers,
            success: true
        });
    }

    return json({
        followers: [],
        success: false
    });
});

function getUser(req, id) {
    var opts = {
        url: getZociaUrl(req) + '/profiles/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var profile = JSON.parse(exchange.content);

    profile.isUserFollowing = isUserFollowing(req, profile._id);
    profile.facultyFellow = profile.roles.some(function(role) {
        return role == "ROLE_PREMIUM";
    });

    profile.activity = getLatestActivity(req, profile, ctx('/'), req.auth.principal.id);

    return profile;
}

function isUserFollowing(req, id) {
    var opts = {
        url: getZociaUrl(req) + '/follow/' + req.auth.principal.id + "/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return (exchange.status === 200);
}

/**
 * Returns the authentication credentials for the current user using the Spring Security
 * classes.
 */
app.get( '/auth', function ( req ) {
    log.info("logging in user");
	return json( req.auth );
} );

/********** Profile pages *********/
app.post('/profiles/', function(req){
    /*var data = {
        "username" : req.postParams.username,
        "name" : {
            "given": req.postParams.name.given,
            "pre": req.postParams.name.pre,
            "surname": req.postParams.name.surname
        },
        "password" : digest(req.postParams.password).toLowerCase(),
        *//*"accountEmail" : {
            "address"  : req.postParams.accountEmail.address
        },*//*
        "accountEmail" : req.postParams.accountEmail,
        "workHistory" : req.postParams.workHistory,
        "educationHistory" : req.postParams.educationHistory,
        "thumbnail": req.postParams.thumbnail,
        "status": "unverified"
    };*/

    delete req.postParams.newPassRepeat;
    var data = req.postParams;

    data.password = digest(req.postParams.password).toLowerCase();
    data.source = 'GC';
    data.accountEmail.status = 'unverified';

    var opts = {
        url: getZociaUrl(req) + '/profiles/',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.get('/profiles/:id', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/profiles/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(exchange.status === 400) {
        opts.url = getZociaUrl(req) + '/profiles/byusername/' + id;

        exchange = httpclient.request(opts);
    }

    var result = {
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };

    if(!result.success) {
        return json(result);
    }

    result.status = exchange.status;

    result.content.isUserFollowing = isUserFollowing(req, result.content._id);
    result.content.facultyFellow = result.content.roles.some(function(role) {
        return role == "ROLE_PREMIUM";
    });

    return json(result);
});

app.get('/profiles/admin', function(req){
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {     
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    var opts = {
        url: getZociaUrl(req) + '/profiles/gc/admin',
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    // this request will return raw elasticsearch query results, so we'll need to run
    // it through a little logic to get what we want
    var profileExchange = httpclient.request(opts);

    var profiles = JSON.parse(profileExchange.content);
    //log.info('Facets returned from Zocia {}', JSON.stringify(profiles.facets, null, 4));
    // we'll be using  the raw elasticsearch result facets
    var facets = profiles.facets;

    // we're really only interested in the hits property of the hits object returned from
    // the query
    profiles = profiles.hits.hits;

    // grab the latest activity for each profile that was done by the user before sending on
    // to angular
    profiles.forEach(function(profile){
        profile.activity = getLatestActivity(req, profile, ctx('/'), req.auth.principal.id);

        profile.isUserFollowing = isUserFollowing(req, profile._id);

        profile.facultyFellow = profile._source.roles.some(function(role) {
            return role == "ROLE_PREMIUM";
        });
    });

    var result = json({
        'status': profileExchange.status,
        'content': profiles,
        'facets': facets,
        'headers': profileExchange.headers,
        'success': Math.floor(profileExchange.status / 100) === 2
    });

    result.status = profileExchange.status;

    return result;
});

app.post('/profiles/admin/filter', function(req){
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {     
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    var data = req.postParams;

    var opts = {
        url: getZociaUrl(req) + '/profiles/gc/admin/filter',
        data: JSON.stringify(data),
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    // this request will return raw elasticsearch query results, so we'll need to run
    // it through a little logic to get what we want
    var profileExchange = httpclient.request(opts);

    var profiles = JSON.parse(profileExchange.content);

    // we're really only interested in the hits property of the hits object returned from
    // the query
    profiles = profiles.hits.hits;

    // grab the latest activity for each profile that was done by the user before sending on
    // to angular
    profiles.forEach(function(profile){
        profile.activity = getLatestActivity(req, profile, ctx('/'), req.auth.principal.id);

        profile.isUserFollowing = isUserFollowing(req, profile._id);

        profile.facultyFellow = profile._source.roles.some(function(role) {
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

app.get('/profiles', function(req){
    var opts = {
        url: getZociaUrl(req) + '/profiles/',
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var profileExchange = httpclient.request(opts);

    var profiles = JSON.parse(profileExchange.content);

    // grab the latest activity for each profile that was done by the user before sending on
    // to angular
    profiles.forEach(function(profile){
        profile.activity = getLatestActivity(req, profile, ctx('/'), req.auth.principal.id);

        profile.isUserFollowing = isUserFollowing(req, profile._id);

        if(profile._id === req.auth.principal.id){
            profile.cannotFollow = true;
        }

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
    var data = req.postParams;

    setUserDetails(req.postParams.thumbnail);

    if(req.postParams.newPass && req.postParams.newPass !== ''){
        data.password = digest(req.postParams.newPass).toLowerCase();
    }

    delete data.newPass;
    delete data.newPassRepeat;
    delete data.isUserFollowing;
    delete data.facultyFellow;
    delete data._type;
    delete data._index;
    delete data._version;
    delete data.followers;

    if(req.postParams.status === "unverified") {
        var servletRequest = req.env.servletRequest;
        if(servletRequest.isUserInRole('ROLE_ADMIN')) {
            data.status = "unverified";
        }
    }

    log.info('PROFILE UPDATE PARAMS ' + JSON.stringify(req.postParams, null, 4));
    var opts = {
        url: getZociaUrl(req) + '/profiles/' + id,
        method: 'PUT',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc',
            'Content-Type': 'application/json',
            'Authorization': _generateBasicAuthorization(req.auth.username, req.auth.password)}),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.del('/profiles/:id', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/profiles/' + id,
        method: 'DELETE',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.get('/profiles/byprimaryemail/:email', function(req, email){
    var opts = {
        url: getZociaUrl(req) + '/profiles/byprimaryemail/' + email,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.get('/profiles/byusername/:username', function(req, username){
    var opts = {
        url: getZociaUrl(req) + '/profiles/byusername/' + username,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
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
        var headers = {};

        log.info('File pre-upload: ' + JSON.stringify(req.params, null, 4));

        var encoding = req.env.servletRequest.getCharacterEncoding();

        var params = {};

        fileUpload.parseFileUpload(req, params, encoding, fileUpload.BufferFactory);

        log.info('File uploaded: ' + JSON.stringify(params, null, 4));

        var exchange;

        if(params.file){
            // as a workaround we're only adding a upload-size to the
            // header if the file is over a certain size
            if(params.size >= 131072){
                headers = {
                    'x-rt-index': 'gc',
                    'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r'),
                    'x-rt-upload-name': params.file.filename,
                    'x-rt-upload-content-type': params.file.contentType,
                    'x-rt-upload-size': params.size
                }
            }else{
                headers = {
                    'x-rt-index': 'gc',
                    'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r'),
                    'x-rt-upload-name': params.file.filename,
                    'x-rt-upload-content-type': params.file.contentType
                }
            }

            var opts = {
                "url": getZociaUrl(req) + '/files/upload/',
                "headers": headers,
                "data": params.file.value,
                "method": 'PUT'
            };

            java.lang.Thread.sleep(1000);

            exchange = httpclient.request(opts);

            //log.info('UPLOAD EXCHANGE CONTENT', JSON.stringify(content, null, 4));

            /*var result = {
                'status': exchange.status,
                'content': JSON.parse(exchange.content),
                'headers': exchange.headers,
                'success': Math.floor(exchange.status / 100) === 2
            };

            result.status = exchange.status;

            return json(result);*/

            if(exchange.status === 200 ){
                var result = {
                    'status': exchange.status,
                    'content': exchange.content,
                    'headers': exchange.headers,
                    'success': Math.floor(exchange.status / 100) === 2
                 };

                 result.status = exchange.status;

                 return json(result);
                /*return {
                    status: 200,
                    headers: {
                        "Content-Type": "'application/json"
                    },
                    body: [content]
                }*/
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

    var opts = {
        "url": getZociaUrl(req) + '/files/crop/' + params.assetKey,
        "headers": {
            'x-rt-index': 'gc',
            'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r')
        },
        "data": params,
        "method": 'PUT'
    };

    return _simpleHTTPRequest(opts);
});

app.get('/profiles/images/', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/profiles/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

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

app.get('/facets/:format', function(req, format){
    var opts = {
        url: getZociaUrl(req) + '/resources/facets/' + format,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.post('/attachments', function(req){
    var opts = {
        url: getZociaUrl(req) + '/resources/',
        method: 'POST',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.get('/attachments', function(req){
    var resourceUrl = req.params.ids.join('&ids[]=');
    resourceUrl = '?ids[]=' + resourceUrl;

    var opts = {
        url: getZociaUrl(req) + '/resources/' + resourceUrl,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc',
            'Content-Type': 'application/json'}),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.get('/attachments/:id', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'GET',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc',
            'Content-Type': 'application/json'}),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.put('/attachments/:id', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'PUT',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc',
            'Content-Type': 'application/json',
            'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.del('/attachments/:id', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'DELETE',
        data: JSON.stringify(req.postParams),
        headers: Headers({ 'x-rt-index': 'gc',
                            'Content-Type': 'application/json',
                            'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

/***********************
 *
 * Utility Functions
 *
 ***********************/

// gets a random quote, used on the homepage. quotes are currently placeholders
app.get('/utility/getquote', function(req) {
    return json({ "quote": returnRandomQuote() });
});

// increments view count for an object
app.post('/utility/view/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/views/" + id,
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});

//likes a specific object. todo: can anonymous users like something?
app.post('/utility/like/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/likes/" + req.auth.principal.id + "/" + id,
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});

//checks to see if a user has already liked this particular object, if so, returns true, otherwise, returns false
app.get('/utility/like/:id', function(req, id) {
    if(!req.auth.isAuthenticated) {
        return json(false);
    }

    var opts = {
        url: getZociaUrl(req) + "/likes/" + req.auth.principal.id + "/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(exchange.status === 404) {
        return json(false);
    } else {
        return json(true);
    }
});

//deletes a like relationship, effectively decreasing total likes by one
app.post('/utility/unlike/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/likes/" + req.auth.principal.id + "/" + id,
        method: 'DELETE',
        headers: Headers({ 'x-rt-index': 'gc', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});

//marks a specific object (namely, discussion posts) as spam. todo: can anonymous users mark something as spam?
app.post('/utility/spam/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/spams/" + req.auth.principal.id + "/" + id,
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});

//checks to see if a user has already marked this particular object as spam, if so, returns true, otherwise, returns false
app.get('/utility/spam/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/spams/" + req.auth.principal.id + "/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(exchange.status === 404) {
        return json(false);
    } else {
        return json(true);
    }
});

//deletes a spam relationship, effectively decreasing total spam count by one
app.post('/utility/unspam/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/spams/" + req.auth.principal.id + "/" + id,
        method: 'DELETE',
        headers: Headers({ 'x-rt-index': 'gc', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});

/**
 * Requires an email address, and passes that to zocia. If the email address is valid/in use, it will send the user an email giving them a link to reset their password using the token that's generated
 */
app.post('/utility/resettoken/', function(req){
    var data = req.postParams;
    data.callback = getZociaUrl(req) + '/';

    log.info('SEND PASSWORD POST DATA!!! ', JSON.stringify(data, null, 4));

    var opts = {
        url: getZociaUrl(req) + '/email/resettoken',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

/**
 * This actually performs the action of resetting the password, given the token from the previous function. Generates a new password, sending it via email, that the user can then use to login
 */
app.post('/utility/resetpassword/', function(req){
    var data = req.postParams;

    var opts = {
        url: getZociaUrl(req) + '/email/resetpassword',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.post('/utility/verifyprofile', function(req){
    var params = req.postParams;
    log.info('Profile id {}', params.profileId);

    var opts = {
        url: getZociaUrl(req) + '/email/resendverifyprofile/' + params.profileId,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

/**
 * Verifies email and sets the user status to "verified"
 */
app.get('/utility/verifyemail/:token', function(req, token){
    var opts = {
        url: getZociaUrl(req) + '/email/verifyprofile/' + token,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

/**
 *  Resends validation token to users email.
 */
app.get('/utility/resendvalidationcode/:email', function(req, email){
    var opts = {
        url: getZociaUrl(req) + '/profiles/byprimaryemail/' + email,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(exchange.status === 404) {
        return json({ "success": false });
    }

    var id = JSON.parse(exchange.content)._id;

    opts = {
        url: getZociaUrl(req) + '/email/resendverifyprofile/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.post('/utility/sendusername/:email', function(req, email){
    var opts = {
        url: getZociaUrl(req) + '/email/sendusername/' + email,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

// GCEE global search
app.post('/search/site/', function(req){
    var url = getZociaUrl(req) + '/search/';

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
            object._source.activity = getLatestActivity(req, object._source, ctx('/'), req.auth.principal.id);

            object._source.facultyFellow = object._source.roles.some(function(role) {
                return role == "ROLE_PREMIUM";
            });
        }

        // We have to get the number of comments for each discussion object
        if(object._source.dataType === 'posts'){
            log.info('Filtered discussion object {}', JSON.stringify(object._source, null, 4));

            var opts = {
                url: getZociaUrl(req) + '/posts/byentities/count?ids[]=' + object._id + '&types=discussion',
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
    var url = getZociaUrl(req) + '/search/';

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
        profile._source.activity = getLatestActivity(req, profile, ctx('/'), req.auth.principal.id);

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
    var url = getZociaUrl(req) + '/search/';

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

    return _simpleHTTPRequest(opts);
});

app.post('/search/discussions/', function(req){
    var url = getZociaUrl(req) + '/search/';

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
            url: getZociaUrl(req) + '/posts/byentities/count?ids[]=' + thread._id + '&types=discussion',
            method: 'GET',
            headers: Headers({ 'x-rt-index': 'gc' }),
            async: false
        };

        exchange = httpclient.request(opts);

        var comment = JSON.parse(exchange.content);

        thread.commentCount = comment.count;
    });

    log.info('EXCHANGE STATUS!!! ', exchange.status);

    return json({
        'status': exchange.status,
        'content': threads,
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });
});

/************************
 *
 * Admin functions
 *
 ************************/
app.get('/admin/users', function(req) {
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {     
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }
    
    var url = getZociaUrl(req) + '/profiles/';

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.put('/admin/users', function(req) {
    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {     
        return {
            status:401,
            headers:{"Content-Type":'text/html'},
            body:[]
        };
    }

    /*var data = {
        "username" : req.postParams.username,
        "name" : {
            "fullName": req.postParams.name.fullName
        },
        "accountEmail" : {
            "address"  : req.postParams.accountEmail.address
        },
        "workHistory" : req.postParams.workHistory
    };*/

    var data = req.postParams;

    var opts = {
        url: getZociaUrl(req) + '/profiles/' + req.postParams._id,
        method: 'PUT',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

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

function _simpleHTTPRequest(opts) {
    var exchange = httpclient.request(opts);

    log.info('EXCHANGE STATUS!!! ', exchange.status);

    return json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });
}

function setUserDetails(thumbnail){
    var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    var auth = SecurityContextHolder.context.authentication;

    // principal can be a simple string or a spring security user object
    var principal = (typeof auth.principal === 'string') ? auth.principal : auth.principal;

    principal.thumbnail = thumbnail;
}

/**
 * Middleware component for Stick to inject Spring Security credentials and props into request object.
 *
 * @return {Function}
 */
function auth(next) {
    return function (req) {
        req.auth = {
            isAuthenticated: false,
            roles: [],
            isUserInRole: function (r) {
                r = r.toLocaleLowerCase();
                return this.roles.some(function (role) {
                    return r === role
                })
            }
        };

        var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
        var springAuth = SecurityContextHolder.context.authentication;

        // An unauthenticated user will have a principal of type String ('anonymousUser')
        if (springAuth && typeof springAuth.principal !== 'string') {
            var p = springAuth.principal;

            // While an authenticated user will have a BLTVUserDetails object as the principal
            req.auth.isAuthenticated = springAuth.isAuthenticated();
            req.auth.username = p.username;
            req.auth.password = p.password;

            var authorities = springAuth.principal.authorities.iterator();
            while (authorities.hasNext()) {
                var authority = authorities.next();
                req.auth.roles.push(authority.toString().toLowerCase());
            }

            req.auth.principal = {
                id: p.id,
                username: p.username,
                name: p.name,
                email: p.email,
                country: p.country,
                profileType: p.profileType,
                accountType: p.accountType,
                thumbnail: p.thumbnail
            };
            // todo: Need to take gender into consideration or generate a unisex thumbnail
            req.auth.principal.thumbnail =
                (p.thumbnail === 'profiles-0000-0000-0000-000000000001' || p.thumbnail === '')
                    ? 'images/GCEE_image_profileMale_135x135.jpeg'
                    : p.thumbnail
        } else {
            req.auth.principal = {
                id: '',
                username: 'AnonymousUser'
            };
        }
        return next(req);
    }
}
