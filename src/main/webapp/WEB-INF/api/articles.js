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
    var query = {
        "query":{
            "bool":{
                "must":[
                    { "field":{ "_all":params.searchTerm } }
                ],
                "should":[
                    { "field":{ "locale":"en" } },
                    { "field":{ "dataType":"profiles posts ventures resources" } }
                ],
                "must_not":[
                    { "field":{ "privacyVisibility.searchResults":"noone" } },
                    { "field":{ "active":"false" } }
                ],
                'minimum_number_should_match':1
            }
        }
    }

    var opts = {
        url: 'http://localhost:9300/myapp/api/resources/search',
        method: 'POST',
        body: query,
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var result = JSON.parse(exchange.content);

    result.content.forEach(function(article) {
        article.doctype = getDocType(article.mimetype);
    });

    return result;
}

var getAllArticles = function(type) {
    var result = ajax('http://localhost:9300/myapp/api/resources/' + type);

    result.content.forEach(function(article) {
        article.doctype = getDocType(article.mimetype);
    });

    return result;
}

var getArticlesByCategory = function(category) {
    var result = ajax('http://localhost:9300/myapp/api/resources/bycategory/' + category);

    result.content.forEach(function(article) {
        article.doctype = getDocType(article.mimetype);
    });

    return result;
}

var getArticle = function(id) {
    var result = ajax('http://localhost:9300/myapp/api/resources/' + id);

    result.content.doctype = getDocType(result.content.mimetype);

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
            doctype = 'doc';
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
            doctype = mimetype.split('/')[0];
            break;
    }

    return doctype;
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

export('ajax', 'searchAllArticles', 'getAllArticles', 'getArticlesByCategory', 'getArticle', 'linkDiscussionToArticle', 'returnRandomQuote');