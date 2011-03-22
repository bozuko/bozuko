var express = require('express');

exports.dir = __dirname;

exports.require = function(module){
    return require(exports.dir+'/app/'+module);
};

this.require('core/error');

exports.db = exports.require('core/db');

/**
 * exports.app MUST be set by the application prior to calling configure()
 */
exports.configure = function(config) {
    this.env = config;
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

exports.game = function(name){
	return this.games[name] || false;
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
		var message = this.require('core/errors/'+path.join('/'))[err];
		var code = null;
		if( typeof message != 'string' && message.code ){
			code = message.code;
			message = message.message;
		}
		return new BozukoError(name,message,data,code);
	}catch(e){
		return new BozukoError();
	}
	
}