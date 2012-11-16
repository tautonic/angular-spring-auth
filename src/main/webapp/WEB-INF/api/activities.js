var log = require('ringo/logging').getLogger(module.id);
var {format} = java.lang.String;
var httpclient = require('ringo/httpclient');

var {Headers} = require('ringo/utils/http');

var {getArticle} = require('articles');

var {trimpathString} = require('trimpath');

var text = {
    "notifications-activity.ac.me.profiles": "${actorLink} invited you to collaborate on ${aboutLink}",
    "notifications-activity.aco.me.profiles": "${actorLink} added you as an owner of ${aboutLink}",
    "notifications-activity.aco.profiles": "${actorLink} added ${directLink} as an owner of ${aboutLink}",
    "notifications-activity.c.claims": "${actorLink} put in a claim request for ${directLink}.",
    "notifications-activity.c.comment": "${actorLink} commented on ${aboutLink}",
    "notifications-activity.c.discussions": "${actorLink} created a discussion called ${aboutLink}",
    "notifications-activity.c.discussions": "${actorLink} created a discussion called ${directLink}",
    "notifications-activity.c.ideas": "${actorLink} created ${directLink}",
    //"notifications-activity.c.themself.profiles": "You created your profile",
    "notifications-activity.c.themself.profiles": "${actorLink} created a profile",
    "notifications-activity.c.profiles": "${actorLink} created ${directLink}",
    "notifications-activity.c.ratings": "${actorLink} gave a rating to ${aboutLink}.",
    "notifications-activity.c.reply": "${actorLink} replied to discussion ${aboutLink}",
    "notifications-activity.c.self.profiles": "You created your profile",
    "notifications-activity.c.self.self.profiles": "You created your profile",
    "notifications-activity.c.spmessages": "${aboutLink}: ${message}",
    "notifications-activity.fsp.profiles": "${actorLink} started following ${directLink}.",
    "notifications-activity.fsp.self.profiles": "${actorLink} started following yourself. THIS SHOULDN'T HAPPEN.",
    "notifications-activity.l.discussions": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.ideas": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.resources": "${actorLink} liked ${aboutLink}",
    "notifications-activity.m.message": "${actorLink} sent you a private message.",
    "notifications-activity.m.reply": "${actorLink} replied to your comment.",
    "notifications-activity.ds.spams": "${actorLink} removed a spam flag on a post.",
    "notifications-activity.ms.spams": "${actorLink} flagged a post as spam.",
    "notifications-activity.no.results": "No recent activity results.",
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
    "notifications-activity.u.themself.profiles": "${actorLink} updated their profile",
    "notifications-activity.u.services": "${actorLink} updated the information for ${directLink}",
    "notifications-activity.ul.discussions": "${actorLink} unliked ${aboutLink}",
    "notifications-activity.ul.resources": "${actorLink} unliked ${aboutLink}",
    "notifications-activity.uco.me.profiles": "${actorLink} promoted you to be an owner of ${aboutLink}",
    "notifications-activity.uco.profiles": "${actorLink} promoted ${directLink} to be an owner of ${aboutLink}",
    "notifications-activity.ufsp.profiles": "${actorLink} stopped following ${directLink}.",
    "notifications-activity.ufsp.services": "${actorLink} stopped following ${directLink}."
};

function getDiscussion(id) {
    var opts = {
        url: "http://localhost:9300/myapp/api/posts/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(Math.floor(exchange.status / 100) !== 2) { console.log("DSICSSISON NOT FOUND");
        return {
            'status': 404,
            'content': JSON.parse(exchange.status),
            'headers': exchange.headers,
            'success': Math.floor(exchange.status / 100) === 2
        }
    }

    return JSON.parse(exchange.content);
}

var ActivityMixin = function(activity, request, baseUrl, authenticatedId) {
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
            return authenticatedId === activity.actor._id;
        }
    }, defAttrs);

    /**
     *
     * @return {object} The properties file passed to the mixin
     */
    Object.defineProperty(result, "thumbnailUrl", {
        get: function() {
            //return baseUrl + "images/190x140.gif";//getThumbnailUrl(activity.actor, 'sml')
            return activity.actor.thumbnail;
        }
    }, defAttrs);

    Object.defineProperty(result, "fullName", {
        get: function() {
            return activity.actor.fullName;
        }
    }, defAttrs);

    Object.defineProperty(result, "profileId", {
        get: function() {
            return activity.actor._id;
        }
    }, defAttrs);

    /**
     *
     * @return {string} Text describing activity
     */

    Object.defineProperty(result, "description", {

        get: function() {

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
                //var thread = getDiscussion(direct.parentId);
                //if (thread) {
                    //verb = 'r';	// for "reply"
                //}

                if (direct.parentId !== direct._id) {
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
            if (activity.actor._id === activity.direct._id && authenticatedId === activity.direct._id) {
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

            if(authenticatedId !== undefined){
                activity.actorLink = authenticatedId == activity.actor._id
                    ? "You"
                    : format('<a href="%s%s/%s">%s</a>', baseUrl, '#/profiles/view',
                    activity.actor._id, activity.actor.fullName || activity.actor.username);
            }else{
                activity.actorLink = format('<a href="%s%s/%s">%s</a>', baseUrl, '#/profiles/view',
                    activity.actor._id, activity.actor.fullName || activity.actor.username);
            }

            var linkId, linkText,
                linkType = type;

            // Indirect object link
            if (about) {
                // Determine data on the indirect object

                // Defaults
                linkId = about._id;
                linkText = about.title;

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
                        linkId = about._id;
                        // Need to get the title here
                        var resource = getArticle(about._id, request.locale);
                        linkText = resource.content.title;
                        linkType = '#/content';
                        break;
                    case 'posts':
                        linkText = about.title;
                        linkId = about._id;
                        linkType = '#/network/discussion/view';

                        if(about._id != about.parentId) {
                            // Get the discussion root
                            var discussion = getDiscussion(about.parentId);
                            linkText = "a reply to " + discussion.title;
                            linkId = discussion._id
                        }
                        break;
                    default: break;
                }

                activity.aboutLink = format('<a href="%s%s/%s">%s</a>',
                    baseUrl, linkType, linkId, linkText);
            }

            // Direct object link
            if (direct) {
                // Determine data on the direct object

                linkId = direct._id;
                linkText = direct.title;

                switch (direct.dataType) {
                    case 'posts':
                        linkId = direct._id;
                        linkText = direct.title;
                        linkType = '#/network';	// fix the URL

                        if(linkText === ''){
                            var discussion = getDiscussion(direct._id);
                            linkText = discussion.title;
                        }

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
                            linkText = discussion.title;
                        }
                        break;
                    case 'ventures':
                        linkId = direct.username;
                        linkText = direct.fullName || direct.username;
                        break;
                    case 'profiles':
                        linkId = direct._id;
                        linkText = direct.fullName || direct.username;
                        // If showing this message to the same user, use the "you" word
                        if (authenticatedId === direct._id) {
                            //linkText = nativeYou.toLowerCase();

                            linkText = 'you';
                        }else{
                            linkText = direct.username;
                        }
                        linkType = '#/profiles/view';
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

var getLatestActivity = function(request, profile, context, userId) {
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
    };

    // Make the AJAX call to get the result set, pagination included, with filtering tacked on the end.
    var activityExchange = httpclient.request(opts);

    var stream = JSON.parse(activityExchange.content);

    //log.info('Activity stream for {}: {}', profile.username, JSON.stringify(stream, null, 4));

    // find the latest activity directly taken by the owner of the profile
    // the latest activity is the last activity in the array
    var activity = new ActivityMixin(stream.pop(), request, context, userId);

    return {
        'fullName': activity.fullName,
        'message': activity.description,
        'dateCreated': activity.props.dateCreated
    };
};

var convertActivity = function(activity, request, context, userId) {
    activity = new ActivityMixin(activity, request, context, userId);

    if (activity.description !== null) {

        return {
            'thumbnailUrl': activity.thumbnailUrl,
            'fullName': activity.fullName,
            'username': activity.props.actor.username,
            'message': activity.description,
            'dateCreated': activity.props.dateCreated,
            'isOwner': activity.isOwner,
            'profileId': activity.profileId
        };
    }
    return null;
};

export('convertActivity', 'getLatestActivity');