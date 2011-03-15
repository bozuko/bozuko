var bozuko      = require('bozuko'),
    fs          = require('fs'),
    URL         = require('url'),
    markdown    = require('markdown-js'),
    util        = require('util');

exports.routes = {

    '/docs': {
        
        description : 'Documentation Output',
        
        get : function(req,res){
            
            // for now, lets just redirect to the api docs...
            if( 1 ) return res.redirect('/docs/api');
            
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
            
            // grab the welcome html
            
            if( !this.welcomeHTML ){
                this.welcomeHTML = markdown.parse( fs.readFileSync(bozuko.dir+'/docs/api/welcome.md', 'utf-8'));
            }
            
            res.render('docs/index', {layout:'docs/layout',tree:tree,title:"bozuko docs",bozuko:bozuko, welcome: this.welcomeHTML});
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
                            cfg.example = JSON.stringify(obj,null,'    ');
                        }
                        else{
                            cfg.example = JSON.stringify(cfg.returns.example, null, '    ');
                        }
                    }
                });
            });
            
            res.render('docs/page',options)
        }
    },
    
    '/docs/api' : {
        
        description : 'Mobile Developer API Docs',
        
        get : function(req,res){
            
            var tree = [];
            var transfers = {
                iconCls     :'objectIcon',
                text        :'Transfer Objects',
                id          :'/objects',
                children    :[]
            };
            var links = {
                iconCls     :'linkIcon',
                text        :'Links',
                id          :'/links',
                children    :[]
            };
            Object.keys(bozuko.links()).sort().forEach(function(key){
                links.children.push({
                    iconCls     :'linkIcon',
                    text        :key,
                    id          :'/links/'+key,
                    leaf        :true
                });
            });
            Object.keys(bozuko.transfers()).sort().forEach(function(key){
                var transfer = bozuko.transfer(key);
                transfers.children.push({
                    iconCls     :'objectIcon',
                    text        :transfer.title || key,
                    id          :'/objects/'+key,
                    leaf        :true
                });
            });
            tree.push(transfers, links);
            
            // grab the welcome html
            
            if( !this.welcomeHTML ){
                this.welcomeHTML = markdown.parse( fs.readFileSync(bozuko.dir+'/docs/api/welcome.md', 'utf-8'));
            }
            
            res.render('docs/api', {layout:'docs/layout',tree:tree,title:"Bozuko API Documentation",bozuko:bozuko, welcome: this.welcomeHTML});
        }
    },
    
    '/docs/api/*' : {
        description : 'Mobile Developer API Doc Page',
        
        get : function(req,res){
            var parts = URL.parse(req.url).pathname.replace(/\/docs\/api\//,'').split('/');
            if( parts.length == 1 ){
                if( !this.html ) this.html = {};
                if( !this.html[parts[0]]){
                    this.html[parts[0]] = markdown.parse( fs.readFileSync(bozuko.dir+'/docs/api/'+parts[0]+'.md', 'utf-8'));
                }
                var html = this.html[parts[0]];
                res.render('docs/api/'+parts[0], {layout: false,bozuko:bozuko, html: html});
            }
            else{
                console.log(parts[0].replace(/s$/,''));
                res.render('docs/api/'+(parts[0].replace(/s$/,'')), {
                    layout: false,
                    bozuko:bozuko,
                    key: parts[1]
                });
            }
        }
    }
};