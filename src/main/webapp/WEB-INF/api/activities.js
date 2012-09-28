var log = require('ringo/logging').getLogger(module.id);
var {format} = java.lang.String;
var httpclient = require('ringo/httpclient');

//var {roundTableAjaxRequest, getContent, getArticle, getThumbnailUrl, getDiscussion, getCompanyById} = require('common-io');
var {getArticle} = require('articles');
var {getDiscussion} = require('discussions');
//var {def} = require('defaults');

var {trimpathString} = require('trimpath');

var text = {
    "notifications-activity.ac.companies": "${actorLink} invited ${directLink} to collaborate on ${aboutLink}",
    "notifications-activity.ac.me.companies": "${actorLink} invited you to collaborate on ${aboutLink}",
    "notifications-activity.ac.me.profiles": "${actorLink} invited you to collaborate on ${aboutLink}",
    "notifications-activity.aco.me.profiles": "${actorLink} added you as an owner of ${aboutLink}",
    "notifications-activity.aco.profiles": "${actorLink} added ${directLink} as an owner of ${aboutLink}",
    "notifications-activity.c.claims": "${actorLink} put in a claim request for ${directLink}.",
    "notifications-activity.c.comment": "${actorLink} commented on ${aboutLink}",
    "notifications-activity.c.companies": "${actorLink} created ${directLink}",
    "notifications-activity.c.discussions": "${actorLink} created a discussion called ${aboutLink}",
    "notifications-activity.c.ideas": "${actorLink} created ${directLink}",
    "notifications-activity.c.themself.profiles": "${actorLink} created your profile",
    "notifications-activity.c.profiles": "${actorLink} created ${directLink}",
    "notifications-activity.c.ratings": "${actorLink} gave a rating to ${aboutLink}.",
    "notifications-activity.c.reply": "${actorLink} replied to discussion ${aboutLink}",
    "notifications-activity.c.self.profiles": "You created your profile",
    "notifications-activity.c.self.self.profiles": "You created your profile",
    "notifications-activity.c.spmessages": "${aboutLink}: ${message}",
    "notifications-activity.cv.companies": "${actorLink} closed ${directLink}",
    "notifications-activity.dc.companies": "${actorLink} removed ${directLink} as a collaborator on ${aboutLink}",
    "notifications-activity.dc.me.companies": "${actorLink} removed you as a collaborator on ${aboutLink}",
    "notifications-activity.dc.self.companies": "You removed yourself as an owner of ${aboutLink}",
    "notifications-activity.dc.themself.companies": "${actorLink} removed themself as a collaborator on ${aboutLink}",
    "notifications-activity.fsp.companies": "${actorLink} started following ${directLink}.",
    "notifications-activity.fsp.services": "${actorLink} stopped following ${directLink}.",
    "notifications-activity.l.companies": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.discussion": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.ideas": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.resources": "${actorLink} liked ${aboutLink}",
    "notifications-activity.m.message": "${actorLink} sent you a private message.",
    "notifications-activity.m.reply": "${actorLink} replied to your comment.",
    "notifications-activity.no.results": "No recent activity results.",
    "notifications-activity.ov.companies": "${actorLink} re-opened ${directLink}",
    "notifications-activity.pi.companies": "${actorLink} turned ${directLink} into a company.",
    "notifications-activity.r.discussions": "${actorLink} replied to a discussion titled ${directLink}.",
    "notifications-activity.recent-activity": "Recent Activity",
    "notifications-activity.spmessages.error": "(could not retrieve this message)",
    "notifications-activity.u.accomplish": "${actorLink} updated the accomplishments for ${directLink}",
    "notifications-activity.u.change": "${actorLink} updated something.",
    "notifications-activity.u.companies": "${actorLink} updated the information for ${directLink}",
    "notifications-activity.u.ideas": "${actorLink} updated the information for ${directLink}",
    "notifications-activity.u.me.profiles": "${actorLink} updated your profile",
    "notifications-activity.u.profiles": "${actorLink} updated ${directLink}",
    "notifications-activity.u.self.profiles": "You updated your profile",
    "notifications-activity.u.services": "${actorLink} updated the information for ${directLink}",
    "notifications-activity.uc.companies": "${actorLink} updated collaborator permissions on ${aboutLink}",
    "notifications-activity.uc.me.companies": "${actorLink} updated collaborator permissions on ${aboutLink}",
    "notifications-activity.uco.me.profiles": "${actorLink} promoted you to be an owner of ${aboutLink}",
    "notifications-activity.uco.profiles": "${actorLink} promoted ${directLink} to be an owner of ${aboutLink}",
    "notifications-activity.ufsp.companies": "${actorLink} stopped following ${directLink}.",
    "notifications-activity.ufsp.services": "${actorLink} stopped following ${directLink}."
}

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

exports.ActivityMixin = function(activity, request, baseUrl) {
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
            return baseUrl + "images/190x140.gif";//getThumbnailUrl(activity.actor, 'sml')
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
            var skinStr = text[key];
            if(skinStr == undefined) {
                log.info("Error: Notification key not found. Expecting: "+key);
            }
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
                : format('<a href="%s%s/%s">%s</a>', baseUrl, 'users',
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
                    baseUrl, linkType, linkId, linkText);
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
                    baseUrl, linkType, linkId, linkText);
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