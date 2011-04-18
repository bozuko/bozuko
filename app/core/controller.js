var merge = require('connect').utils.merge;
var auth = require('./auth');

function Controller(app,name,config){
    this.app = app;
    this.name = name;
    this.doc = {
        routes : {}
    };
    this.config = config;
    merge( this, config );
    this.route( this.routes );
}

Controller.prototype = {

    route : function(routes){

        var _this = this;
        var app = this.app;

        Object.keys(routes).forEach(function(route){

            var config = routes[route];
            if( !config.methods ) config.methods = ['get'];
            if( !config.methods.forEach ) config.methods = [config.methods];

            var path = route;
            if( !config.aliases ) config.aliases = [];
            if( config.alias ) config.aliases.push(config.alias);

            if( !/^\//.test(path)) path = '/'+path;
            if( !/\/\?$/.test(path) && /\w$/.test(path)) path += '/?';

            ['get','post','put','del','all'].forEach( function(method){

                if( config[method] ){
                    var handler = function(req,res){
                        res.send("Handler is not configured yet :(");
                    };
                    if( config[method] instanceof Function ){
                        handler = config[method];
                    }
                    else{
                        // this should be an object now..
                        var methodConfig = config[method];
                        if( !methodConfig.handler && methodConfig.doc && methodConfig.doc.returns && methodConfig.doc.returns.example ){
                            var example = methodConfig.doc.returns.example;
                            handler = function(req,res){
                                var ret = example;
                                if( example instanceof Function ){
                                    ret = example.apply(_this,arguments);
                                }
                                res.send(ret);
                            };
                        }
                        else if( methodConfig.handler ){
                            handler = methodConfig.handler;
                        }

                        if( methodConfig.access ){
                            handler = auth.check(methodConfig.access, handler);
                        }

                        // check for docs...
                        if( !_this.doc.routes[route] ) _this.doc.routes[route] = {};
                        var doc = _this.doc.routes[route];

                        doc[method] = methodConfig.doc || {
                            description: 'No decription yet',
                            params: [],
                            returns: {
                                type: 'undefined'
                            }
                        };

                    }

                    // change the controller to use a modified version of the
                    // express "render" function
                    var $handler = handler;
                    handler = function(req,res){
                        var _render = res.render;
                        res.render = function(){
                            var args = Array.prototype.slice.call(arguments, 0);

                            // local variables should be the second variable
                            if( args.length < 2 ) return _render.apply(res, args);
                            var opts = _this.renderOptions || {};

                            // need to clone renderOptions to prevent the original from being corrupted
                            var _opts = {};
                            for( var i in (opts||{})){
                                _opts[i] = opts[i];
                            }

                            // combine any locals that were provided
                            args[1] = merge( _opts , args[1] || {} );
                            return _render.apply(res, args);
                        }
                        $handler(req,res);
                    };

                    app[method](path, function(req,res){
                        handler.apply(_this,arguments);
                    });
                    config.aliases.forEach(function(alias){
                        app[method](alias, function(req,res){
                            handler.apply(_this,arguments);
                        });
                    });
                }
            });
        });
    },


    forward : function(path){

    }

};

function createController(app,name,config){
    var controller = new Controller(app,name,config);
    return controller;
}

exports.Controller = Controller;
exports.create = createController;