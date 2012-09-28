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
var {getAllArticles, getArticlesByCategory, getArticle, linkDiscussionToArticle} = require('articles');
var {getDiscussion, getDiscussionByParent, getDiscussionList, addReply, createDiscussion, editDiscussionPost} = require('discussions');

var {encode} = require('ringo/base64');

var app = exports.app = Application();
app.configure( 'notfound', 'params', 'mount', 'route' );

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

app.get( '/ping', function ( req ) {
	var servletRequest = req.env.servletRequest;

	return json( {
		url: '/ping',
		user: servletRequest.isUserInRole( 'ROLE_USER' ),
		admin: servletRequest.isUserInRole( 'ROLE_ADMIN' ),
		anonymous: servletRequest.isUserInRole( 'ROLE_ANONYMOUS' )
	} );
} );


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

    var result = json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });

    result.status = exchange.status;

    return result;
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

app.get('/profiles/asyncEmail/:email', function(req, email){
    //java.lang.Thread.sleep(5000);
    var valid = true;

    for(var key in profiles){
        if(email === profiles[key].email){
            valid = false;
            break;
        }
    }

    return json(valid);
});

/**
 * @function
 * @name POST /images/upload
 * @description Uploads images to S3 via RoundTable
 * @param {JsgiRequest} request
 * @returns {JsgiResponse} An HTML <div> containing a JSON string with upload results
 */
app.post('/profiles/images/upload/', function (req) {
    /*var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var profile = JSON.parse(exchange.content);

    log.info('EXCHANGE CONTENT ', JSON.stringify(profile, null, 4));

    if (!profile) return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    };*/

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
                    'x-rt-upload-content-type': params.file.contentType
                    //'x-rt-upload-size': String(fileSize)
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

app.get('/data/', function(req) {
    var opts = {
        url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' + req.params.q,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        async: false
    };

    var exchange = httpclient.request(opts);

    var universities = JSON.parse(exchange.content);

    universities.predictions.forEach(function(element, index, array){
        if(element.description.toLowerCase().indexOf('university') === -1 ||
            element.description.toLowerCase().indexOf('college') === -1 )
        {
            universities.predictions.slice(index, 1);
        }
    });

    return json({"universities": universities.predictions});
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
            accountType: principal.accountType
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

    return result;
}



