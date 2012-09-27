var log = require('ringo/logging').getLogger(module.id);
var {format} = java.lang.String;
var httpclient = require('ringo/httpclient');

//var {roundTableAjaxRequest, getContent, getArticle, getThumbnailUrl, getDiscussion, getCompanyById} = require('common-io');
var {getArticle} = require('articles');
var {getDiscussion} = require('discussions');
//var {def} = require('defaults');

var {trimpathString} = require('trimpath');

function getProfile(id) {
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
}

exports.ActivityMixin = function(activity, request) {
    var result = {};

    var defAttrs = {
        enumerable: true,
        configurable: true
    };

    /**
     *
     * @return {object} The properties file passed to the mixin
     */
    Object.defineProperty(result, "props", {
        get: function() {
            return activity;
        }
    }, defAttrs);

    /**
     *
     * @return {object} The properties file passed to the mixin
     */
    Object.defineProperty(result, "isOwner", {
        get: function() {
            return request.authenticatedId === activity.actor._id;
        }
    }, defAttrs);

    /**
     *
     * @return {object} The properties file passed to the mixin
     */
    Object.defineProperty(result, "thumbnailUrl", {
        get: function() {
            return getThumbnailUrl(activity.actor, 'sml')
        }
    }, defAttrs);

    /**
     *
     * @return {string} Text describing activity
     */

    Object.defineProperty(result, "description", {
        get: function() {

            //log.info(JSON.stringify(activity));

            var actor = activity.actor,
                verb = activity.verb,
                about = activity.about,
                direct = activity.direct,
                type;

            // Try to determine the "type" of the activity
            if (direct && direct.dataType) {
                type = direct.dataType;
            } else if (about && about.dataType) {
                type = about.dataType;
            }

            // Differentiate between data objects w/ the same type. e.g. "posts" can refer to comments or discussions
            if (type === 'posts') {

                type = direct.type;

                // Fix pluralization of "discussion"
                if (type === "discussion") {
                    type = "discussions";
                }

                // Determine if a post is a "reply" or not - if activity parentId prop resolves, it's a reply
                var thread = getDiscussion(direct.parentId);
                if (thread) {
                    verb = 'r';	// for "reply"
                }
            }

            // If the activity is a "like", the object that was "liked" needs to be determined
            if (type === "likes") {
                switch (direct.entityDataType) {
                    case 'posts':
                        // Determine if this is a comment, public or private discussion
                        if (about.type === "discussion") {
                            type = 'discussions';
                        } else {
                            type = 'comments';
                        }
                        break;
                    case 'resources':
                        type = 'resources';
                        break;
                }
            }

            // Try to determine if the user is taking action against their own profile
            if (activity.actor._id === activity.direct._id && request.authenticatedId === activity.direct._id) {
                verb += '.self';
            } else if (activity.actor._id === activity.direct._id) {
                verb += '.themself';
            }

            // Look up translation
            var key = String('notifications-activity.' + verb + '.' + type).toLowerCase();
            var skinStr = i18n(key);

            // DEBUG
            // if (key) {
            // 	log.info(key);
            // }
            // if (skinStr) {
            // 	log.info(skinStr);
            // }

            // Substitute links

            // Subject link
            activity.actorLink = request.authenticatedId == activity.actor._id
                ? "you"
                : format('<a href="%s%s/%s">%s</a>', ctx('/'), 'users',
                activity.actor.username, activity.actor.fullName || activity.actor.username);

            // Indirect object link
            if (about) {
                // Determine data on the indirect object

                // Defaults
                var linkId = about._id,
                    linkText = about.title,
                    linkType = type;

                switch (about.dataType) {
                    case 'ventures':
                        linkId = about.username;
                        linkText = about.fullName || about.username;
                        if (about.idea) {
                            linkType = "ideas";
                        } else if (about.serviceProvider) {
                            linkType = "services";
                        } else {
                            linkType = "companies";
                        }
                        break;
                    case 'resources':
                        linkId = about.key;
                        // Need to get the title here
                        var resource = getArticle(about.key, request.locale);
                        linkText = resource.title;
                        linkType = 'resources';
                        break;
                    case 'posts':
                        // Get the discussion root
                        var discussion = getDiscussion(about._id);
                        break;
                    default: break;
                }

                activity.aboutLink = format('<a href="%s%s/%s">%s</a>',
                    ctx('/'), linkType, linkId, linkText);
            }

            // Direct object link
            if (direct) {
                // Determine data on the direct object

                var linkId = direct._id,
                    linkText = direct.title,
                    linkType = type;

                switch (direct.dataType) {
                    case 'posts':
                        linkId = direct._id;
                        linkText = direct.title;
                        linkType = 'discussions';	// fix the URL

                        // If the "about" object is a venture, this means the discussion is "private"
                        if (about && about.dataType === 'ventures') {
                            linkId = about.username + '/private/discussions/' + linkId;
                            if (about.idea) {
                                linkType = 'ideas';
                            } else if (about.serviceProvider) {
                                linkType = 'services';
                            } else {
                                linkType = 'companies';
                            }

                            // Otherwise we have to look up the post info
                        } else if (about && about.dataType === "posts") {
                            // Get the discussion root
                            var discussion = getDiscussion(about._id);
                        }
                        break;
                    case 'ventures':
                        linkId = direct.username;
                        linkText = direct.fullName || direct.username;
                        break;
                    case 'profiles':
                        linkId = direct.username;
                        linkText = direct.fullName || direct.username;
                        // If showing this message to the same user, use the "you" word
                        if (request.authenticatedId === direct._id) {
                            linkText = nativeYou.toLowerCase();
                        }
                        linkType = 'users';
                        break;
                }

                activity.directLink = format('<a href="%s%s/%s">%s</a>',
                    ctx('/'), linkType, linkId, linkText);
            }

            // Special case: service provider messages
            /*if (type === "spMessages") {
                if (!activity.direct.message) {
                    // If we can't get the message string, don't display anything to the user
                    activity.message = "There was an error loading the service provider thing";
                } else {
                    activity.message = activity.direct.message;
                }
            } */

            // log.info("\n*************************\n");
            return trimpathString(skinStr, activity);
        }
    }, defAttrs);

    return result;
};