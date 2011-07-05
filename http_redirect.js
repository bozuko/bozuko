var http = require('http');

module.exports = http.createServer(function(req, res){
    var ssl_url = 'https://www1.bozuko.com'+req.url;
    res.writeHead(301, {
        'Location':ssl_url
    });
    res.end();
});