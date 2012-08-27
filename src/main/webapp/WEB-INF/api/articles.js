var httpclient = require('ringo/httpclient');
var {Headers} = require('ringo/utils/http');

var getArticle = function(id) {
    var opts = {
        url: 'http://localhost:9300/myapp/api/resources/' + id,
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

export('getArticle');