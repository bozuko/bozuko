var print = require('util').debug;
var test_count = 0;

var server = null;

module.exports = {
   setup_server: function(srv, fn) {
	server = srv;
	server.__port = 6000 + process.getuid();
	server.listen(server.__port, '127.0.0.1', fn);
    },
    
    export_test: function(name, module_exports, fn) {
	module_exports[name] = fn;
	test_count++;
    },
    
    done: function() {
	if (!(--test_count)) {
	    setTimeout(function(){Bozuko.db.conn().disconnect();}, 1);
	    if (server) {
		server.close();
	    }
	}
    }
}
