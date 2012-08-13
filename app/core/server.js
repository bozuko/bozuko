var express = require('express'),
    net     = require('net'),
    fs      = require('fs');

/**
 * Create our main server
 */
var app;

if( Bozuko.getConfig().server.ssl ){
    var ssl_config = {
        key: fs.readFileSync(Bozuko.cfg('server.ssl_config.key', Bozuko.dir+'/ssl/wildcard/wildcard.bozuko.com.key')),
        ca: fs.readFileSync(Bozuko.cfg('server.ssl_config.ca', Bozuko.dir+'/ssl/wildcard/gd_bundle.crt')),
        cert: fs.readFileSync(Bozuko.cfg('server.ssl_config.cert', Bozuko.dir+'/ssl/wildcard/bozuko.com.crt'))
    };
    app = express.createServer(ssl_config);
}
else{
    app = express.createServer();
}

module.exports = app;