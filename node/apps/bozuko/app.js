var net     = require('net'),
    repl    = require('repl');

var multinode = require('/home/bozuko/bozuko/node/lib/multi-node');

/**
 * Module dependencies.
 */
var express = require('express');

/**
 * Create our main server
 */
var app = express.createServer();

/**
 * Global Bozuko Object initialization
 */
Bozuko = {};
Bozuko.app = app;
Bozuko.dir = __dirname;
Bozuko.require = function(module){
    return require(this.dir+'/app/'+module);
};

Bozuko.config = require('./config/development').config;
Bozuko.db = Bozuko.require('db');

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

require('./app/main').run(app);

// Only listen on $ node app.js
module.exports = app;

if (!module.parent) {
    multinode.listen({   
      port: global.Bozuko.config.server.port,
      nodes: 4
    }, app);
    //    console.info("Bozuko server listening on port "+ app.address().port);
}

var repl = net.createServer( function(socket){
    repl.start("bozuko> ", socket);
});
multinode.listen({port: 8050, nodes:1}, repl);
