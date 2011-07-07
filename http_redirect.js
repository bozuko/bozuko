var http = require('http'),
    config = require('./config/site')
    ;

module.exports = http.createServer(function(req, res){
    var ssl_url = (config.server.ssl ? 'https://' : 'http://')
                + config.server.host
                + req.url;
                
    res.writeHead(301, {
        'Location':ssl_url
    });
    res.end();
});

module.exports.listen(80);