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
    key:fs.readFileSync('./ssl/wildcard/wildcard.bozuko.com.key'),
    ca:fs.readFileSync('./ssl/wildcard/gd_bundle.crt'),
    cert:fs.readFileSync('./ssl/wildcard/bozuko.com.crt')
};
var app = express.createServer(ssl);
// var app = express.createServer();

/**
 * Load common Bozuko stuff
 */
var bozuko= require('./bozuko');

bozuko.app = app;
bozuko.init();

// Only listen on $ node app.js
module.exports = app;

// If we are running the application in the context of another application,
// like another router or with the 'connect' command, then let them
// start listening.
if (!module.parent) {
    var nodes = multinode.listen({
        port: Bozuko.config.server.port,
        nodes: 4
    }, app);

    console.log("Bozuko Server listening on port ",Bozuko.config.server.port);

    if (nodes.isMaster) {
        // setup stats collection
        if(Bozuko.env === 'stats'){
            initStats();
        }
        if( Bozuko.env == 'development' ){
            Bozuko.require('dev/setup').init();
        }
        
        var replServer = net.createServer(function(socket){
            repl.start("bozuko> ", socket);
        }).listen(Bozuko.config.server.port+10, '127.0.0.1');

        console.log("Bozuko REPL listening on port ",Bozuko.config.server.port+10);
    }
}

function initStats() {
    var stats = Bozuko.require('util/stats');
    var ms_per_hr = 1000*60*60;
    var ms_per_day = ms_per_hr*24;

    // Do an initial collection. Mongoose middleware will prevent duplication of records
    // for the same day if a crash occurs.
    stats.collect_all(logErr);

    setInterval(function() {
        stats.collect_all(logErr);
    }, ms_per_day);
    console.log('initStats');
}

function logErr(err, val) {
    if (err) {
        console.log(err);
    }
}
