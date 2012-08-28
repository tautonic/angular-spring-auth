/**
 * @fileOverview Entry point for all web calls
 */
var httpclient = require('ringo/httpclient');
var {Headers} = require('ringo/utils/http');

var log = require( 'ringo/logging' ).getLogger( module.id );
var {trimpath, trimpathResponse, registerHelper} = require( 'trimpath' );
var {json} = require( 'ringo/jsgi/response' );
var {digest} = require('ringo/utils/strings');

var {Application} = require( 'stick' );
var {getArticle} = require('articles');
var {getDiscussion, getDiscussionList, addReply, createDiscussion} = require('discussions');

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

app.get('/discussion/all', function(req, id) {
    return json(getDiscussionList().content);
});

app.get('/discussion/:id', function(req, id) {
    var result = getDiscussion(id);

    if(result.status !== 200) {
        return json(false);
    }

    return json(result.content);
});

app.put('/discussion/:id/:post', function(req, id, post) {
    var editedPost = req.params;

    editDiscussionPost(id, post, editedPost);

    return json(true);
});

app.post('/discussion/new', function(req) {
    var discussion = req.params;
    //var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    //var auth = SecurityContextHolder.context.authentication;

    return json({ "newId" : createDiscussion(discussion["0"], getUsernamePassword()) });
});

app.post('/discussion/:id', function(req, id) {
    var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    var auth = SecurityContextHolder.context.authentication;

    var servletRequest = req.env.servletRequest;
    if(servletRequest.isUserInRole('ROLE_ANONYMOUS'))
    {
        return json(false);
    }

    return json(addReply(id, req.params.reply, getUsernamePassword()));
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


/**
 * Returns the authentication credentials for the current user using the Spring Security
 * classes.
 */
app.get( '/auth', function ( req ) {
    java.lang.Thread.sleep(1000);
	var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
	var auth = SecurityContextHolder.context.authentication;

	// principal can be a simple string or a spring security user object
	var principal = typeof auth.principal === 'string' ? auth.principal : auth.principal.username;
	var result = {
		principal: String( principal ),
		roles: []
	};

	var authorities = auth.authorities.iterator();
	while ( authorities.hasNext() ) {
		var authority = authorities.next();
		result.roles.push( authority.authority.toLowerCase() );
	}
    log.info("logging in user");
	return json( result );
} );

app.post('/profiles/', function(req){
    var data = req.postParams;
    data.source = 'test';
    data.accountEmail.status = 'unverified';

    log.info('POST PARAMS', JSON.stringify(req.postParams, null, 4));

    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

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
    var opts = {
        url: 'http://localhost:9300/myapp/api/profiles/' + id,
        method: 'PUT',
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
app.post('/profiles/pics/:id', function (req, id) {

    var profile = profiles[id];

    if (!profile) return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    };

    var contentType = req.env.servletRequest.getContentType();
    if ((req.method === "POST" || req.method === "PUT") && fileUpload.isFileUpload(contentType)) {
        log.info('File pre-upload: ' + JSON.stringify(req.params, null, 4));

        var encoding = req.env.servletRequest.getCharacterEncoding();

        var params = {};

        fileUpload.parseFileUpload(req, params, encoding, fileUpload.TempFileFactory);
        log.info('File uploaded: ' + JSON.stringify(params, null, 4));
        profile.imageUrl = params.file.tempfile;

        return {
            status: 201,
            headers: {
                "Content-Type": "text/plain"
            },
            body: [req.env.servletRequest.getRequestURL().toString()]
        };

    }
    return {
        status:400,
        headers:{"Content-Type":'text/html'},
        body:[]
    };
});


app.get('/profiles/pics/:id', function(req, id){
    var profile = profiles[id];

    if (!profile) return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    };

    if (profile.imageUrl) {


        var input = new java.io.FileInputStream(new java.io.File(profile.imageUrl));
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


/************************
 *
 * Page functions
 *
 ************************/

function homepage( req ) {
	return json( {homepage: true} );
}

/*
Utitliy functions
*/

function _generateBasicAuthorization(username, password) {
	var header = username + ":" + password;
	var base64 = encode(header);
	return 'Basic ' + base64;
}

function getUserByEmail(email){

}

function getUsernamePassword() {
    return { "username": "fred", "password": digest("secret").toLowerCase() };
}



