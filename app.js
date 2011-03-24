var net     = require('net'),
    fs      = require('fs'),
    repl    = require('repl'),
    multinode = require('multi-node');

/**
 * Module dependencies.
 */
var express = require('express');

/**
 * Create our main server
 */
var ssl = {
    key:fs.readFileSync('ssl/privatekey.pem'),
    cert:fs.readFileSync('ssl/certificate.pem')
};
var app = express.createServer(ssl);

/**
 * Load common Bozuko stuff
 */
var bozuko = require('bozuko');

bozuko.app = app;
bozuko.run('development');

// Only listen on $ node app.js
module.exports = app;


// If we are running the application in the context of another application,
// like another router or with the 'connect' command, then let them
// start listening.
if (!module.parent) {
    var nodes = multinode.listen({
        port: bozuko.config.server.port,
        nodes: 4
    }, app);

    console.log("Bozuko Server listening on port ",bozuko.config.server.port);

    if (nodes.isMaster) {
        var replServer = net.createServer(function(socket){
            repl.start("bozuko> ", socket);
        }).listen(bozuko.config.server.port+10);

        console.log("Bozuko REPL listening on port ",bozuko.config.server.port+10);
        console.log("awesome");
    }
}