
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
            
            var paths = [route];
            if( config.alias ) config.aliases = [config.alias];
            if( config.aliases ) paths = paths.concat(config.aliases);
            
            paths.forEach( function(path){
                
                // clean up the path for sloppy input
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
                            if( !methodConfig.handler && methodConfig.example ){
                                handler = function(req,res){
                                    
                                    if( methodConfig.example instanceof Function ){
                                        methodConfig.example = methodConfig.example.apply(_this,arguments);
                                    }
                                    res.send(methodConfig.example);
                                }
                            }
                            else if( methodConfig.handler ){
                                handler = methodConfig.handler;
                            }
                            
                            // check for docs...
                            if( methodConfig.doc ){
                                var doc = _this.doc.routes[route] = methodConfig.doc;
                            }
                            
                        }
                        app[method](path, function(){
                            handler.apply(_this,arguments);
                        });
                    }
                });
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