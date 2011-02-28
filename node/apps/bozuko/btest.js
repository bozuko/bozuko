var bozuko = require('bozuko');
var express = require('express');

var print = require('util').debug;

var port = 6000 + process.getuid();

module.exports = {
    setup_app: function(fn) {
	/**
	 * These steps should mimic those in app.js
	 */
	var app = express.createServer();
	var bozuko = require('bozuko');
	bozuko.app = app;
	bozuko.run('test');
	
	app.__port = ++port;
	app.listen(app.__port, '127.0.0.1', 
		   function() { fn(app); });
    },
    
    export_test: function(server, name, module_exports, fn) {
	module_exports[name] = fn;
	server.test_count++;
    },
    
    done: function(server) {
	if (!(--server.test_count)) {
	    setTimeout(function(){bozuko.db.conn().disconnect();}, 1);
	    if (server) {
		server.close();
	    }
	}
    }
}
