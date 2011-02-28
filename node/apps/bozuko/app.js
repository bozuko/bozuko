var net     = require('net'),
    repl    = require('repl');

/**
 * Module dependencies.
 */
var express = require('express');

/**
 * Create our main server
 */
var app = express.createServer();

/**
 * Load common Bozuko stuff
 */
var bozuko = require('bozuko');

bozuko.app = app;
bozuko.run('development');

// Only listen on $ node app.js
module.exports = app;

if (!module.parent) {
  var multinode = require('/home/bozuko/bozuko/node/lib/multi-node');
  multinode.listen({   
    port: bozuko.config.server.port,
    nodes: 4
  }, app);

  console.log("Bozuko Server listening on port ",bozuko.config.server.port);

  var replServer = net.createServer( function(socket){
      repl.start("bozuko> ", socket);
  });
  multinode.listen({port: bozuko.config.server.port+1, nodes:1}, replServer);
  console.log("Bozuko REPL listening on port ",bozuko.config.server.port+1);
}

