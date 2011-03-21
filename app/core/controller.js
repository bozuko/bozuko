var bozuko = require('bozuko');

function Controller(app,name){
    this.app = app;
    this.name = name;
    this.doc = {
        routes : {}
    };
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
                            }
                        }
                        else if( methodConfig.handler ){
                            handler = methodConfig.handler;
                        }
                        
                        if( methodConfig.access ){
                            var _handler = handler;
                            switch( methodConfig.access ){
                                case 'user':
                                    handler = function(req,res){
                                        if( !req.session.user ){
                                            return res.send( bozuko.transfer('error',{
                                                name: 'noauth',
                                                msg: 'This action requires a user session',
                                                links: {
                                                    'facebook_login' : '/user/login'
                                                }
                                            }), 401);
                                        }
                                        return _handler(req,res);
                                    };
                                    break;
                            }
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
                    app[method](path, function(){
                        handler.apply(_this,arguments);
                    });
                    config.aliases.forEach(function(alias){
                        app[method](alias, function(){
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

function createController(app,name,routes){
    var controller = new Controller(app,name);
    controller.route(routes);
    return controller;
}

exports.Controller = Controller;
exports.create = createController;