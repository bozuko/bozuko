var express = require('express');

var Logger = module.exports = function(options){
    
    // this will correct the options object for us
    var expressLogger = express.logger(options),
        ignore=null,
        useRegexp=options.useRegexp;
    
    if( options.ignore ){
        ignore = options.ignore;
        if( !Array.isArray(ignore) ){
            ignore = [ignore];
        }
    }
    
    return function logger(req, res, next){
        if( ignore ){
            for(var i=0; i<ignore.length; i++){
                if( useRegexp ? req.url.match( ignore[i] ) : (req.url === ignore[i]) ){
                    return next();
                }
            }
        }
        return expressLogger(req, res, next);
    }
};