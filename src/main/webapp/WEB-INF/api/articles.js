var httpclient = require('ringo/httpclient');
var {Headers} = require('ringo/utils/http');
var {encode} = require('ringo/base64');

var log = require( 'ringo/logging' ).getLogger( module.id );

function ajax(url) {
    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return {
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };
}

var searchAllArticles = function(params) {
    var query;
    var from = params.from || 0;
    var size = params.size || 10;
    var sorting = [ "_score" ];

    switch(params.sort) {
        case "recent":
            sorting = [ { "dateCreated": "desc"}, "_score" ];
            break;
        case "popular":
            sorting = [ { "views": "desc"}, {"likes": "desc"}, "_score" ];
            break;
        case "featured":
            sorting = [ { "dateCreated": "desc"}, "_score" ];
            break;
        default:
    }

    if(params.term) {
            query = {
            "bool": {
                "should": [
                    { "field": { "title": params.term } },
                    { "field": { "content": params.term } },
                    { "field": { "description": params.term } }
                ],
                "minimum_number_should_match": 1
            }
        };
    } else {
        query = {
            "match_all": {}
        }
    }

    var data = {
        "query": {
            "filtered": {
                "query": query,
                "filter": {
                    "and": [
                        {
                            "terms": {
                                "locale": [
                                    "en",
                                    "en_US"
                                ]
                            }
                        },
                        {
                            "term": {
                                "format": "article"
                            }
                        }
                    ]
                }
            }
        },
        "from": from,
        "size": size,
        "sort": sorting
    };

    if(params.filters) {
        var mimetypeFilters = [];
        var filters = params.filters.split(',');

        //currently set up to skip the last filter in the list. this is because an extra comma is added to the filters param, which is interpreted as a blank string
        //blank strings are otherwise useless in mimetype stuff, so we drop it entirely as it is junk data
        for(var i = 0; i < filters.length - 1; i++)
        {
            mimetypeFilters = mimetypeFilters.concat(getPossibleMimetypes(filters[i]));
        }

        data.query.filtered.filter.and.push({ "terms": { "mimetype": mimetypeFilters }});
    }
    log.info("QUERYING? "+JSON.stringify(data));
    var opts = {
        url: 'http://localhost:9300/myapp/api/resources/search',
        method: 'POST',
        data: JSON.stringify(data),
        headers: Headers({ 'x-rt-index': 'gc', "Content-Type": "application/json" }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = JSON.parse(exchange.content);

    if(typeof(result) == "object" ) {
        result.forEach(configureArticles);
    } else {
        result = [];
    }

    return result;
}

var getAllArticles = function(type, max) {
    var result = ajax('http://localhost:9300/myapp/api/resources/' + type + '/' + max);

    result.content.forEach(configureArticles);

    return result;
}

var getArticlesByCategory = function(category) {
    var result = ajax('http://localhost:9300/myapp/api/resources/bycategory/' + category);

    result.content.forEach(configureArticles);

    return result;
}

var getArticle = function(id) {
    var result = ajax('http://localhost:9300/myapp/api/resources/' + id);

    if(!result.success) {
        return false;
    }

    result.content.doctype = getDocType(result.content.mimetype);
    result.content.premium = (result.content.roles.some(function(element) { return element == "ROLE_PREMIUM"; }));

    return result;
}

function getDocType(mimetype) {
    var doctype;
    switch(mimetype)
    {
        case 'application/pdf':
            doctype = 'pdf';
            break;
        case 'application/msword':
            doctype = 'word';
            break;
        case 'application/mspowerpoint':
        case 'application/powerpoint':
        case 'application/vnd.ms-powerpoint':
        case 'application/x-mspowerpoint':
            doctype = 'powerpoint';
            break;
        case 'application/excel':
        case 'application/vnd.ms-excel':
        case 'application/x-excel':
        case 'application/x-msexcel':
            doctype = 'excel';
            break;
        case 'application/rtf':
        case 'application/x-rtf':
        case 'text/richtext':
            doctype = 'rtf';
            break;
        default:
            //this handles video and image cases, and defaults to text if it doesn't know what it is
            if(mimetype != undefined)
            {
                doctype = mimetype.split('/')[0];
            } else {
                doctype = "text";
            }
            break;
    }

    return doctype;
}

function getPossibleMimetypes(doctype) {
    var mimetypes;
    switch(doctype)
    {
        case 'pdf':
            mimetypes = ['application/pdf'];
            break;
        case 'word':
            mimetypes = ['application/msword'];
            break;
        case 'powerpoint':
            mimetypes = ['application/mspowerpoint', 'application/powerpoint', 'application/vnd.ms-powerpoint', 'application/x-mspowerpoint'];
            break;
        case 'excel':
            mimetypes = ['application/excel', 'application/vnd.ms-excel', 'application/x-excel', 'application/x-msexcel'];
            break;
        case 'rtf':
            mimetypes = ['application/rtf', 'application/x-rtf', 'text/richtext'];
            break;
        case 'video':
            mimetypes = ['video/x-qtc', 'video/quicktime', 'video/mpeg', 'video/x-mpeg', 'video/x-mpeq2a', 'video/x-mpeg', 'video/x-sgi-movie', 'video/x-motion-jpeg', 'video/avi', 'video/msvideo', 'video/x-msvideo', 'video/x-ms-asf', 'video/x-ms-asf-plugin'];
            break;
        case 'image':
            mimetypes = ['image/png', 'image/tiff', 'image/x-tiff', 'image/x-quicktime', 'image/pict', 'image/x-pict', 'image/x-pcx', 'image/x-jps', 'image/pjpeg', 'image/jpeg', 'image/x-icon', 'image/gif', 'image/x-windows-bmp', 'image/bmp'];
            break;
        case 'text':
        default:
            mimetypes = ['text/html', 'text/plain', 'text/xml'];
            break;
    }

    return mimetypes;
}

var quotes = [
    "I have not failed. I’ve just found 10,000 ways that won’t work. – Thomas Edison",
    "The only place where success comes before work is in the dictionary. – Vidal Sassoon",
    "Business opportunities are like buses, there’s always another one coming. – Richard Branson",
    "Formal education will make you a living; self-education will make you a fortune. – Jim Rohn",
    "An entrepreneur tends to bite off a little more than he can chew hoping he’ll quickly learn how to chew it. – Roy Ash",
    "The most valuable thing you can make is a mistake – you can’t learn anything from being perfect. – Adam Osborne",
    "A man must be big enough to admit his mistakes, smart enough to profit from them, and strong enough to correct them. – John C. Maxwell",
    "Our business in life is not to get ahead of others, but to get ahead of ourselves. - E. Joseph Cossman",
    "Logic will get you from A to B. Imagination will take you everywhere. – Albert Einstein",
    "You can’t ask customers what they want and then try to give that to them. By the time you get it built, they’ll want something new. – Steve Jobs",
    "Live out of your imagination instead of out of your memory. – Fortune Cookie",
    "Success is liking yourself, liking what you do, and liking how you do it. – Maya Angelou",
    "The most important thing in communication is to hear what isn’t being said. – Peter F. Drucker",
    "If everything seems under control, you’re just not going fast enough. – Mario Andretti",
    "If what you are doing is not moving you towards your goals, then it’s moving you away from your goals. – Brian Tracy",
    "The entrepreneur builds an enterprise; the technician builds a job. – Michael Gerber",
    "As long as you’re going to be thinking anyway, think big. – Donald Trump",
    "Don’t make friends who are comfortable to be with. Make friends who will force you to lever yourself up. – Thomas J. Watson",
    "The link between my experience as an entrepreneur and that of a politician is all in one word: freedom. – Silvio Berlusconi",
    "Success is walking from failure to failure with no loss of enthusiasm. – Winston Churchill",
    "A man’s worth is no greater than the worth of his ambitions. – Marcus Aurelius Antoninus",
    "If you cannot do great things, do small things in a great way. – Napoleon Hill",
    "I don’t know the key to success, but the key to failure is trying to please everybody. – Bill Cosby",
    "In order to succeed, your desire for success should be greater than your fear of failure. – Bill Cosby",
    "Tell everyone what you want to do and someone will want to help you do it. – W. Clement Stone",
    "Success is not in what you have, but who you are. – Bo Bennet",
    "Failure is not about insecurity. It’s about lack of execution. – Jeffrey Gitomer",
    "Coming together is a beginning; keeping together is progress; working together is success. – Henry Ford",
    "Great achievement is usually born of great sacrifice, and is never the result of selfishness. -  Napoleon Hill",
    "Regardless of who you are or what you have been, you can be what you want to be. – W. Clement Stone",
    "Better understated than overstated. Let people be surprised that it was more than you promised and easier than you said. – Jim Rohn",
    "Try not to be a man of success, but rather try to become a man of value. – Albert Einstein",
    "The best way to predict the future is to create it. – Peter Drucker",
    "You can do anything you wish to do, have anything you wish to have, be anything you wish to be. – Robert Collier",
    "A leader is one who knows the way, goes the way, and shows the way. – John C. Maxwell",
    "For every good reason there is to lie, there is a better reason to tell the truth. – Bo Bennett",
    "Entrepreneurship is the last refuge of the trouble making individual. – Natalie Clifford Barney",
    "Success is walking from failure to failure with no loss of enthusiasm. – Winston Churchill",
    "I do not believe a man can ever leave his business. He ought to think of it by day and dream of it by night. – Henry Ford",
    "You were born to win, but to be a winner, you must plan to win, prepare to win, and expect to win. – Zig Ziglar",
    "Every choice you make has an end result. – Zig Ziglar",
    "Discipline is the bridge between goals and accomplishment. – Jim Rohn",
    "Action speaks louder than words but not nearly as often. – Mark Twain",
    "Successful people are always looking for opportunities to help others. Unsuccessful people are asking, What’s in it for me? – Brian Tracy",
    "A goal is a dream with a deadline. – Napoleon Hill",
    "Entrepreneurship is neither a science nor an art. It is a practice. – Peter Drucker",
    "Tell the world what you intend to do, but first show it. – Napoleon Hill",
    "The function of leadership is to produce more leaders, not more followers. – Ralph Nader",
    "Effective communication is 20% what you know and 80% how you feel about what you know. – Jim Rohn",
    "Act enthusiastic and you will be enthusiastic. – Dale Carnegie"
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var returnRandomQuote = function() {
    return quotes[getRandomInt(0, quotes.length)];
}

function generateBasicAuthorization(user) {
    var header = user.username + ":" + user.password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}

function configureArticles(article) {
    article.doctype = getDocType(article.mimetype);
    article.premium = (article.roles.some(function(element) { return element == "ROLE_PREMIUM"; }));
}

export('ajax', 'searchAllArticles', 'getAllArticles', 'getArticlesByCategory', 'getArticle', 'linkDiscussionToArticle', 'returnRandomQuote');