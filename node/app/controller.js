
function Controller(app,name){
    this.app = app;
    this.name = name;
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
            if( config.aliases ) paths = paths.concat(config.aliases);
            
            paths.forEach( function(path){
                
                // clean up the path for sloppy input
                if( !/^\//.test(path)) path = '/'+path;
                if( !/\/\?$/.test(path) && /\w$/.test(path)) path += '/?';
                
                ['get','post','put','del','all'].forEach( function(method){
                    if( config[method] && config[method] instanceof Function){
                        app[method](path, function(){
                            config[method].apply(_this,arguments);
                        });
                    }
                });
                /*
                config.methods.forEach(function(method){
                    app[method](path,function(){
                        config.fn.apply(_this,arguments);
                    });
                    
                });
                */
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