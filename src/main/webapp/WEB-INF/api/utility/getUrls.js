
//gets the Zocia URL (this includes the /api part). Requires request object
var getZociaUrl = function(request) {
    var configParams = request.env.servlet.getBean('configParams');
    return configParams.get('zociaUrl');
};

//gets the base URL for Zocia. For instance: http://localhost:9300/
var getZociaBase = function(request) {
    var configParams = request.env.servlet.getBean('configParams');
    return configParams.get('zociaBase');
};

//gets the URL of the current server the website is hosted on. This is going to need to be passed up to the main website for calling the backend javascript stuff
var getLocalUrl = function(request) {
    var url = request.env.servletRequest.requestURL.toString();

    // If the "context" string is in the URL, strip everything out after that
    if (url.indexOf(ctx) !== -1) {
        url = url.split('/').splice(0, 4).join('/');
    } else {
        // Otherwise, all that is needed is the domain
        url = url.split('/').splice(0, 3).join('/');
    }

    return url;
};

export("getZociaUrl", "getZociaBase", "getLocalUrl");