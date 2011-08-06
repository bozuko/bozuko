var express = require('express'),
    net     = require('net'),
    fs      = require('fs');

/**
 * Create our main server
 */
var app;

if( Bozuko.getConfig().server.ssl ){
    var ssl_config = {
        key: fs.readFileSync(Bozuko.dir+Bozuko.cfg('server.ssl_config.key', '/ssl/wildcard/wildcard.bozuko.com.key')),
        ca: fs.readFileSync(Bozuko.dir+Bozuko.cfg('server.ssl_config.ca', '/ssl/wildcard/gd_bundle.crt')),
        cert: fs.readFileSync(Bozuko.dir+Bozuko.cfg('server.ssl_config.cert', '/ssl/wildcard/bozuko.com.crt'))
    };
    app = express.createServer(ssl_config);
}
else{
    app = express.createServer();
}

module.exports = app;