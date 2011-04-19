var merge = require('connect').utils.merge,
    auth = require('./auth');

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

        var self = this;
        var app = this.app;

        Object.keys(routes).forEach(function(route){

            var config = routes[route];
            if( !config.methods ) config.methods = ['get'];
            if( !config.methods.forEach ) config.methods = [config.methods];

            var path = route;
            if( !config.aliases ) config.aliases = [];
            if( config.alias ) config.aliases.push(config.alias);

            ['get','post','put','del','all'].forEach( function(method){

                if( config[method] ){
                    var handler = function(req,res){
                        res.send("Handler is not configured yet :(");
                    };
                    var _locals = self.locals || {};
                    merge(_locals, config.locals || {});
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

                        if( methodConfig.access ){
                            handler = auth.check(methodConfig.access, handler);
                        }

                        if( methodConfig.title ){
                            _locals.title = methodConfig.title;
                        }
                        if( methodConfig.locals ){
                            merge(_locals, methodConfig.locals);
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
                            res.locals[i] = _locals[i];
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
                            args[1] = merge( locals, args[1] || {} );
                            return _render.apply(res, args);
                        }
                        $handler(req,res);
                    };
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


    forward : function(path){

    }

};

function createController(app,name,config){
    var controller = new Controller(app,name,config);
    return controller;
}

exports.Controller = Controller;
exports.create = createController;
