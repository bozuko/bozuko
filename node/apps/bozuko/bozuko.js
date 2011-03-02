var express = require('express');

exports.dir = __dirname;

exports.require = function(module){
    return require(exports.dir+'/app/'+module);
};

exports.db = exports.require('core/db');


/**
 * exports.app MUST be set by the application prior to calling configure()
 */
exports.configure = function(config) {
    var app = exports.app;
    if (!app) {
	throw new Error("bozuko.app not set!");
    }
    switch(config) {

	case 'production':
	    exports.config = require('./config/production');
	    app.use(express.errorHandler());
	    break;

	case 'test':
	    exports.config = require('./config/test');
	    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	    break;

	default:
	    exports.config = require('./config/development');
	    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	}
};

exports.run = function(config) {
    if (config) {
	exports.configure(config);
    } else if (!exports.config){
	throw new Error("No configuration given!");
    }
    require('./app/main').run(exports.app);
};

exports.services = {};
exports.service = function(name){
	if( !exports.services[name] ){
		var Service = this.require('core/services/'+(name||'facebook'));
		exports.services[name] = new Service();
	}
	return exports.services[name];
};
