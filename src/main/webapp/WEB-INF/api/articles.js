var httpclient = require('ringo/httpclient');
var {Headers} = require('ringo/utils/http');

function ajax(url) {
    var opts = {
        url: url,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'nep' }), //todo: current seed tool seeds article/resources into the nep index
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

var getAllArticles = function(type) {
    return ajax('http://localhost:9300/myapp/api/resources/' + type);
}

var getArticlesByCategory = function(category) {
    return ajax('http://localhost:9300/myapp/api/resources/bycategory/' + category);
}

var getArticle = function(id) {
    return ajax('http://localhost:9300/myapp/api/resources/' + id);
}

export('getAllArticles', 'getArticlesByCategory', 'getArticle');