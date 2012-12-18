var log = require('ringo/logging').getLogger(module.id);
var {format} = java.lang.String;
var httpclient = require('ringo/httpclient');

var {Headers} = require('ringo/utils/http');

var {getArticle} = require('articles');
var {getZociaUrl, getLocalUrl} = require('utility/getUrls');
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
    "notifications-activity.d.discussions": "${actorLink} deleted a discussion.",
    "notifications-activity.fsp.profiles": "${actorLink} started following ${directLink}.",
    "notifications-activity.fsp.self.profiles": "${actorLink} started following yourself.", //this should never be used, if it did, something went horribly wrong, or the user cheated.
    "notifications-activity.l.discussions": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.ideas": "${actorLink} liked ${aboutLink}",
    "notifications-activity.l.resources": "${actorLink} liked ${aboutLink}",
    "notifications-activity.m.message": "${actorLink} sent you a private message.",
    "notifications-activity.m.reply": "${actorLink} replied to your comment.",
    "notifications-activity.ds.spams": "${actorLink} removed a spam flag on a post.",
    "notifications-activity.ms.spams": "${actorLink} flagged a post as spam.",
    "notifications-activity.no.results": "No recent activity results.",
    "notifications-activity.r.discussions": "${actorLink} replied to a discussion titled ${directLink}.",
    "notifications-activity.r.comment": "${actorLink} commented on an article titled ${directLink}.",
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

function getDiscussion(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/posts/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(Math.floor(exchange.status / 100) !== 2) {
        return {
            'status': 404,
            'content': JSON.parse(exchange.status),
            'headers': exchange.headers,
            'success': Math.floor(exchange.status / 100) === 2
        }
    }

    return JSON.parse(exchange.content);
}

function activityObject(activity, request, baseUrl, authenticatedId) {
    var result = {};

    var defAttrs = {
        enumerable: true,
        configurable: true
    };

    result.props = activity;
    result.isOwner = (authenticatedId === activity.actor._id);
    result.profileId = activity.actor._id;

    var opts = {
        url: getZociaUrl(request) + "/profiles/" + result.profileId,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(Math.floor(exchange.status / 100) !== 2) {
        return {
            'status': 404,
            'content': JSON.parse(exchange.status),
            'headers': exchange.headers,
            'success': Math.floor(exchange.status / 100) === 2
        }
    }

    var profile = JSON.parse(exchange.content);

    result.thumbnailUrl = profile.thumbnail;

    result.fullName = profile.name.fullName;

    result.username = profile.username;

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
        //var thread = getDiscussion(request, direct.parentId);
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
                break;
            case 'resources':
                linkId = about._id;
                // Need to get the title here
                var resource = getArticle(request, about._id, request.locale);
                linkText = resource.content.title;
                linkType = '#/content/view';
                break;
            case 'posts':
                linkText = about.title;
                linkId = about._id;
                linkType = '#/network/discussion/view';

                if(about._id != about.parentId) {
                    // Get the discussion root
                    var discussion = getDiscussion(request, about.parentId);
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
                linkType = '#/network/discussion/view';
                var discussion;
                if(linkText === ''){
                    discussion = getDiscussion(request, direct._id);
                    linkText = discussion.title;
                }

                //if the user commented on an article
                if (type === "comment") {
                    discussion = getDiscussion(request, direct._id);
                    var article;
                    if(discussion._id !== discussion.threadId) {
                        discussion = getDiscussion(request, discussion.threadId);
                    }
                    article = getArticle(request, discussion.parentId);

                    linkId = article.content._id;
                    linkText = article.content.title;
                    linkType = '#/content/view';

                    // Otherwise we have to look up the post info
                } else if (about && about.dataType === "posts") {
                    // Get the discussion root
                    discussion = getDiscussion(request, about._id);

                    if(discussion._id !== discussion.threadId) {
                        discussion = getDiscussion(request, discussion.threadId);
                    }
                    linkText = discussion.title;
                    linkId = discussion.threadId;
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

    result.description = trimpathString(skinStr, activity);

    return result;
}

var getLatestActivity = function(request, profile, context, userId) {
    var filters = "likes comments discussions collaborators ideas companies profiles spMessages";
    var filteredActivities = 'likes comments discussions collaborators ideas companies profiles spMessages';
    var allowedActivities = filters.trim().split(' ');

    //remove terms that are not in the active filter list
    allowedActivities.forEach(function(activity) {
        filteredActivities = filteredActivities.replace(activity, '');
    });

    //this gets the lastest/newest activity from a user, returning only one result
    var url = getZociaUrl(request) + '/activities/byactor/' + profile._id + '/newest';

    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var activityExchange = httpclient.request(opts);

    var stream = JSON.parse(activityExchange.content)[0];

    //log.info('Activity stream for {}: {}', profile.username, JSON.stringify(stream, null, 4));

    // find the latest activity directly taken by the owner of the profile
    // the latest activity is the last activity in the array
    var activity = activityObject(stream, request, context, userId);

    return {
        'fullName': activity.fullName,
        'message': activity.description,
        'dateCreated': activity.props.dateCreated
    };
};

var convertActivity = function(activity, request, context, userId) {
    activity = activityObject(activity, request, context, userId);

    if (activity.description !== null) {

        return {
            'thumbnailUrl': activity.thumbnailUrl,
            'fullName': activity.fullName,
            'username': activity.username,
            'message': activity.description,
            'dateCreated': activity.props.dateCreated,
            'isOwner': activity.isOwner,
            'profileId': activity.profileId
        };
    }
    return null;
};

export('convertActivity', 'getLatestActivity');