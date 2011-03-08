var bozuko  = require('bozuko'),
    util    = require('util');

exports.routes = {

    '/docs': {
        
        description : 'Documentation Output',
        
        get : function(req,res){
            
            //ignore
            var ignore = ['Site','Admin','Business','Docs'];
            
            var tree = [];
            Object.keys(bozuko.controllers).forEach( function(Name){
                if( ~ignore.indexOf(Name) ) return;
                var node = {
                    iconCls     :'controllerIcon',
                    text        :Name,
                    id          :'controller-'+Name,
                    children    :[]
                };
                var Controller = bozuko.controllers[Name];
                var routes = Controller.doc.routes;
                Object.keys(routes).forEach( function(route, index){
                    var Route = {
                        iconCls     :'routeIcon',
                        text        :route,
                        id          :'route-'+Name+'-'+index,
                        children    :[]
                    };
                    
                    var methods = routes[route];
                    Object.keys(methods).forEach(function(method){
                        
                        Route.children.push({
                            iconCls     :'methodIcon',
                            text        :method.toUpperCase(),
                            id          :'method-'+Name+'-'+index+'-'+method,
                            leaf        :true
                        });
                    });
                    node.children.push(Route);
                });
                tree.push(node);
            });
            
            res.render('docs/index', {layout:'docs/layout',tree:tree,title:"bozuko docs",bozuko:bozuko});
        }
    },
    
    '/docs/page/:name' : {
        
        get : function(req,res){
            var name = req.params.name;
            var controller = bozuko.controllers[name];
            var options = {layout:false,controller:controller,name:name};
            
            Object.keys(controller.doc.routes).forEach(function(route,index){
                var methods = controller.doc.routes[route];
                Object.keys(methods).forEach(function(method){
                    var cfg = methods[method];
                    if( cfg && cfg.returns && cfg.returns.example ){
                        if( cfg.returns.example instanceof Function ){
                            // get the route...
                            var fakeReq = {params:{}};
                            var obj = cfg.returns.example.apply(this, [fakeReq,null]);
                            cfg.example = JSON.stringify(obj,null,'\t');
                        }
                        else{
                            cfg.example = JSON.stringify(cfg.returns.example, null, '\t');
                        }
                    }
                });
            });
            
            res.render('docs/page',options)
        }
    }
};