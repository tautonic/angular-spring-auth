/**
 * @fileOverview Entry point for all web calls
 */
var log = require( 'ringo/logging' ).getLogger( module.id );
var {trimpath, trimpathResponse, registerHelper} = require( 'trimpath' );
var {json} = require( 'ringo/jsgi/response' );

var {Application} = require( 'stick' );
var {getArticle} = require('articles');
var {getDiscussion} = require('discussions');

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

    var servletRequest = req.env.servletRequest;
    if(!servletRequest.isUserInRole('ROLE_ADMIN'))
    {
        delete article.content;
    } else {
        //todo: make this replacement actually replace things properly. this solution is not feasible for long term
        var newUrl = "http://localhost:8080" + ctx("/#/article/");

        article.content = article.content.replace(new RegExp("http://example.com/blog/article-title-"), newUrl.toString());
    }

    return json(article);
});

app.get('/discussion/:id', function(req, id) {
    return json(getDiscussion(id));
});

app.post('/discussion/:id', function(req, id) {
    var postContent = req.params;

    return json({
        owner: {
            username: "fred102",
            picture: "http://localhost:8080/gc/images/40x40.gif"
        },
        content: postContent.reply
    });
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


/************************
 *
 * Page functions
 *
 ************************/

function homepage( req ) {
	return json( {homepage: true} );
}



