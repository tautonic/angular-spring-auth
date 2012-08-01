/**
 * @fileOverview Entry point for all web calls
 */
var log = require( 'ringo/logging' ).getLogger( module.id );
var {trimpath, trimpathResponse, registerHelper} = require( 'trimpath' );
var {json} = require( 'ringo/jsgi/response' );

var {Application} = require( 'stick' );

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

app.get( '/ping', function ( req ) {
	var servletRequest = req.env.servletRequest;

	return json( {
		url: '/ping',
		user: servletRequest.isUserInRole('ROLE_USER'),
		admin: servletRequest.isUserInRole('ROLE_ADMIN'),
		anonymous: servletRequest.isUserInRole('ROLE_ANONYMOUS')
	} );
} );


/************************
 *
 * Page functions
 *
 ************************/

function homepage( req ) {
	return json( {homepage: true} );
}



