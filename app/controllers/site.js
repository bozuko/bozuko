var ExtJs       = Bozuko.require('util/extjs'),
    facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    URL         = require('url'),
    qs          = require('querystring');
    
exports.renderOptions = {
    nav: [
        {
            text: 'about',
            link: '/p/about'
        },
        {
            text: 'bozuko for business',
            link: '/business'
        },
        function(locals){
            var link = locals.user ? {
                text: 'logout',
                link: '/user/logout'
            } : {
                text: 'login',
                link: '/login?return='+escape('/')
            };
            return link;
        }
    ]
}

exports.routes = {

    '/' : {
        

        description :'Index page',

        all : function(req,res){
            var i = 0;
            var u = req.session.user;
            var locals = {
                title: 'Bozuko',
                scripts:[]
            };
            if( req.session.device == 'desktop' ){
                locals.scripts.push('/js/desktop/pages/index.js');
            }
            res.render('site/index.jade', locals);
        }
    },

    '/about' : Page("About Bozuko",'site/about'),

    '/p/*' : {

        description : "General pages - written in jade - located in views/[device]/pages",

        get : function(req, res, next){
            var path = 'pages/'+URL.parse(req.url).pathname.replace(/\/p\//, '');
            res.render(path,{'title' : 'Bozuko'});
        }
    },
    
    '/business' : Page('Bozuko for business', 'business/index'),

    '/get_token' : {

        get : function(req,res){
            Bozuko.require('core/auth').login(req,res,'user','/get_token',

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
            access: 'user',
            get : graph,
            post : graph
        };
    })(),

    '/site/config' : {

        description :"Return the publicly available configuration",

        get : function(req,res){
            var config = {
                facebook:{
                    appId: Bozuko.config.facebook.app.id,
                    perms:Bozuko.config.facebook.perms
                }
            };
            res.send("Bozuko = window.Bozuko || {}; Bozuko.config = "+JSON.stringify(config)+";", {"Content-Type":"text/javascript"} );
        }
    },

    'games' : {

        get : function(req,res){
            res.send(Bozuko.games);
        }
    }
};