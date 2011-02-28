var bozuko = require('bozuko');

var ExtJs       = bozuko.require('util/extjs'),
    facebook    = bozuko.require('util/facebook'),
    Page        = bozuko.require('util/page'),
    URL         = require('url'),
    qs          = require('querystring');

exports.routes = {
    
    '/' : {
        
        description :'Index page',
        
        all : function(req,res){
            var locals = {
                title: 'Bozuko',
                scripts:[]
            };
            if( req.session.device == 'desktop' ){
                locals.scripts.push('/js/desktop/pages/index.js');
            }
            res.render('site/index.jade', {locals:locals});
        }
    },
    
    '/about' : Page("About Bozuko",'site/about'),
    
    '/p/*' : {
        
        description : "General pages - written in jade - located in views/[device]/pages",
        
        get : function(req, res, next){
            var path = 'pages/'+URL.parse(req.url).pathname.replace(/\/page\//, '');
            
            res.render(path,{
                locals:{
                    'title' : 'Bozuko'
                }
            });
        }
    },
    
    '/get_token' : {
        
        get : function(req,res){
            bozuko.require('auth').login(req,res,'user','/get_token',
                
                function success(user,req,res){
                    res.redirect('/get_token/token/'+user.facebook_auth+'/user/'+user.facebook_id);
                    return false;
                },
                
                function failure(error, req, res){
                    res.redirect('/get_token/error/'+escape(error));
                    return false;
                }
                
            );
        }
    },
    
    '/get_token/error/*' : {
        get : function(req, res){
            // we don't need to display anything here.
            // because we are just passing stuff through the url
            res.send('');
        }
    },
    
    '/get_token/token/:token/user/:user' : {
        get : function(req, res){
            // we don't need to display anything here.
            // because we are just passing stuff through the url
            res.send('');
        }
    },
    
    '/graph/*' : (function(){
        
        function graph(req,res){
            var params={};
            var path = req.url.replace(/^\/graph/,'');
            
            if( req.method == 'GET'){
                var search =  URL.parse(req.url).query;
                if( search ) params = qs.parse(search);
            }
            else if( req.method == 'POST'){
                if( req.params ) req.params = params;
            }
            
            facebook.graph(path,{
                method : req.method,
                user : req.session.user,
                params : params
            }, function(data){
                res.send(data);
            });
        }
        
        return {
            get : graph,
            post : graph
        };
    })(),
    
    '/site/config' : {
        
        description :"Return the publicly available configuration",
        
        get : function(req,res){
            var config = {
                facebook:{
                    appId: bozuko.config.facebook.app.id,
                    perms:bozuko.config.facebook.perms
                }
            };
            res.send("Bozuko = window.Bozuko || {}; Bozuko.config = "+JSON.stringify(config)+";", {"Content-Type":"text/javascript"} );
        }
    },
    
    'games' : {
        
        get : function(req,res){
            res.send(bozuko.games);
        }
    }
};