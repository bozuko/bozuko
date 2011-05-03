var express = require('express'),
    net     = require('net'),
    fs      = require('fs');

/**
 * Create our main server
 */
var ssl = {
    key:fs.readFileSync(Bozuko.dir+'/ssl/wildcard/wildcard.bozuko.com.key'),
    ca:fs.readFileSync(Bozuko.dir+'/ssl/wildcard/gd_bundle.crt'),
    cert:fs.readFileSync(Bozuko.dir+'/ssl/wildcard/bozuko.com.crt')
}, app;

if( Bozuko.getConfig().server.ssl ){
    app = express.createServer(ssl);
}
else{
    app = express.createServer();
}

module.exports = app;