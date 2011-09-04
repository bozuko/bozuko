var
    merge = Bozuko.require('util/object').merge,
    http = require('http'),
    auth = require('./auth')
    ;

var ignores = ['req','res'];

function Controller(app,name,config){
    this.app = app;
    this.name = name;
    this.refs = {};
    this.doc = {
        routes : {}
    };
    this.config = config;
    merge( this, config, ignores );
	this.init();
    this.beforeRoute();
    if( this.routes ) this.route( this.routes );
    this.afterRoute();
    // if( this.sockets ) this.io( this.sockets );
}

Controller.prototype = {

    route : function(routes){

        var self = this;
        var app = this.app;
        
        var controllerSession = (self.session !== false);

        Object.keys(routes).forEach(function(route){

            var config = routes[route];
            if( !config.methods ) config.methods = ['get'];
            if( !config.methods.forEach ) config.methods = [config.methods];

            var path = route;
            if( !config.aliases ) config.aliases = [];
            if( config.alias ) config.aliases.push(config.alias);
            
            var routeSession = !!controllerSession;
            if( config.session === false ){
                routeSession = false;
            }
            
            ['get','post','put','del','all'].forEach( function(method){
                
                var methodSession = !!routeSession,
                    ref = false;

                if( config[method] ){
                    var handler = function(req,res){
                        res.send("Handler is not configured yet :(");
                    };
                    var _locals = merge({}, self.locals || {}, ignores);
                    merge(_locals, config.locals || {}, ignores);
                    if( config.title ) _locals.title = config.title;
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
                                    ret = example.apply(self,arguments);
                                }
                                res.send(ret);
                            };
                        }
                        else if( methodConfig.handler ){
                            handler = methodConfig.handler;
                        }
                        
                        if( methodConfig.ref ){
                            ref = methodConfig.ref;
                        }

                        if( methodConfig.access ){
                            handler = auth.check(methodConfig.access, handler);
                        }

                        if( methodConfig.title ){
                            _locals.title = methodConfig.title;
                        }
                        if( methodConfig.locals ){
                            merge(_locals, methodConfig.locals);
                        }
                        
                        if( methodConfig.filter ){
                            handler = middleware( methodConfig.filter, handler, self);
                        }
                        
                        if( methodConfig.session === false ){
                            methodSession = false;
                        }
                        // check for docs...
                        if( !self.doc.routes[route] ) self.doc.routes[route] = {};
                        var doc = self.doc.routes[route];

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
                        res.locals = {};
                        for(var i in _locals){
                            res.locals[i] = Array.isArray(_locals[i]) ? _locals[i].slice(0) : _locals[i];
                        }
                        res.render = function(){
                            var args = Array.prototype.slice.call(arguments, 0);

                            // local variables should be the second variable
                            if( args.length == 0  ) return _render.apply(res, args);

                            // need to clone renderOptions to prevent the original from being corrupted
                            var locals = {};
                            for( var i in res.locals){
                                locals[i] = res.locals[i];
                            }
                            locals['req'] = req;
                            // combine any locals that were provided
							var merge = require('connect').utils.merge;
                            args[1] = merge( merge({}, locals), args[1] || {} );
                            return _render.apply(res, args);
                        }
                        $handler.apply(self,arguments);
                    };
                    
                    // add our controller middleware
                    if (self.filter ){
                        handler = middleware(self.filter, handler, self);
                    }
                    // add our access
                    if( self.access ){
                        handler = auth.check( self.access, handler );
                    }
                    
                    if( !methodSession ){
                        handler = middleware(function(req, res, next){
                            var end = res.end;
                            res.end = function(data, encoding){
                                res.end = end;
                                delete req.session;
                                res.end(data, encoding);
                            }
                            next();
                        }, handler, self);
                    }
                    
                    if( ref ){
                        self.refs[ref] = handler;
                    }
                    
                    path = self._cleanPath(path);
                    app[method](path, function(req,res){
                        handler.apply(self,arguments);
                    });
                    config.aliases.forEach(function(alias){
                        alias = self._cleanPath(alias);
                        app[method](alias, function(req,res){
                            handler.apply(self,arguments);
                        });
                    });
                }
            });
        });
    },

    _cleanPath : function(path){
        if( !/^\//.test(path)) path = '/'+path;
        if( !/\/\?$/.test(path) && /\w$/.test(path)) path += '/?';
        return path;
    },
    
    io : function(sockets){
        
    },

    forward : function(path){

    },
	
	init : function(){
		
	},
    
    beforeRoute : function(){
        
    },
    
    afterRoute : function(){
        // empty override
    }

};

function createController(app,name,config){
    var controller = new Controller(app,name,config);
    return controller;
}

function middleware(fn, old, scope){
    return function(req, res){
        var args = arguments;
        fn.call(scope, req, res, function(){
            return old.apply(scope,args);
        });
    };
}

exports.Controller = Controller;
exports.create = createController;
