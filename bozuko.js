var express = require('express');

exports.dir = __dirname;

exports.require = function(module){
	try{
		return require(exports.dir+'/app/'+module);
	}catch(e){
		console.log('Module not found ('+module+')');
		throw(e);
	}
};

this.require('core/error');

exports.db = exports.require('core/db');

var self = this;

/**
 * exports.app MUST be set by the application prior to calling configure()
 */
exports.configure = function() {
    this.env = process.env.NODE_ENV;
    var app = exports.app;
    if (!app) {
	throw new Error("Bozuko.app not set!");
    }

    app.configure('development', function() {
        exports.config = require('./config/development');
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function() {
        exports.config = require('./config/production');
	app.use(express.errorHandler());
    });

    app.configure('test', function() {
	exports.config = require('./config/test');
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('stats', function() {
	exports.config = require('./config/stats');
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });
};

exports.init = function() {
    if (!process.env.NODE_ENV) {
	throw new Error("No configuration given! Please set NODE_ENV environment variable.");
    }
    this.configure();
    require('./app/main').init(this.app);
};

exports.services = {};
exports.service = function(name){
	if( !exports.services[name] ){
            var Service = this.require('core/services/'+(name||'facebook'));
	    exports.services[name] = new Service();
	}
	return exports.services[name];
};

exports.game = function(contest){
	return new this.games[contest.game](contest);
};

exports.transfer = function(key, data){
	if( !data ) return this._transferObjects[key];
	try{
            return this._transferObjects[key].sanitize(data);
	}catch(e){
            throw new Error("Transfer Object ["+key+"] does not exist");
	}
};

exports.validate = function(key, data) {
    if( !data ) return false;
    return this._transferObjects[key].validate(data);
};

exports.sanitize = function(key, data){
    if( !data ) return false;
    return this.transfer(key, data);
};

exports.transfers = function(){
    return this._transferObjects;
};

exports.link = function(key){
    return this._links[key];
};

exports.links = function(){
    return this._links;
};

exports.entry = function(key, user, options){
    var Entry = this.require('core/contest/entry/'+key);
    return new Entry(key, user, options);
};

exports.error = function(name, data){

	var path = name.split('/');
	var err = path.pop();
	var BozukoError = this.require('core/error');

	try{
            var message = this.require('errors/'+path.join('/'))[err];
	    var code = null;
	    if( typeof message != 'string' && message.code ){
		code = message.code;
	        message = message.message;
	    }
	    return new BozukoError(name,message,data,code);
	}catch(e){
            return new BozukoError();
	}
};

exports.t = function(){
    return self.require('core/lang').translate.apply(this, arguments);
};