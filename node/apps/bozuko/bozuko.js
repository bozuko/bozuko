var express = require('express');

exports.dir = __dirname;

exports.require = function(module){
    return require(exports.dir+'/app/'+module);
};

exports.db = exports.require('db');


/**
 * exports.app MUST be set by the application prior to calling configure()
 */
exports.configure = function(config) {
    var app = exports.app;
    if (!app) {
	throw new Error("bozuko.app not set!");
    }
   switch(config) {
       case 'development':
           exports.config = require('./config/development').config;
           app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
       case 'production':
           exports.config = require('./config/production').config;
           app.use(express.errorHandler()); 
       case 'test':
           exports.config = require('./config/test').config;
           app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
       default:
           exports.config = require('./config/development').config;
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
