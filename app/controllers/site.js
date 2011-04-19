var ExtJs       = Bozuko.require('util/extjs'),
    facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    URL         = require('url'),
    fs          = require('fs'),
    qs          = require('querystring');
    
exports.locals = {
    nav: [
        {
            text: 'Home',
            link: '/'
        },
        {
            text: 'About Bozuko',
            link: '/p/about'
        },
        {
            text: 'Bozuko for Business',
            link: '/business'
        },
        {
            text: 'Contact',
            link: '#'
        }
    ],
    head_scripts:[
        'https://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js',
        '/js/jquery/plugins/jquery.fancybox-1.3.4/fancybox/jquery.fancybox-1.3.4.pack.js'
    ],
    // styles: ['/js/jquery/plugins/jquery.fancybox-1.3.4/style.css'],
    title: "Bozuko"
}

exports.routes = {

    '/' : {
        
        description :'Index page',

        get: function(req,res){
            var u = req.session.user;
            var locals = {
                title: 'Bozuko',
                scripts:[]
            };
            if( req.session.device == 'desktop' ){
                locals.scripts.push('/js/desktop/pages/index.js');
            }
            res.render('site/index', locals);
        }
    },
    
    'coming-soon':{
        description: 'Coming soon page',
        
        get : function(req,res){
            res.locals.layout = false;
            // get the mailchimp signup form
            res.locals.cities = [
                "Boston, MA",
                "New York, NY",
                "Austin, TX",
                "San Francisco, CA",
                "Los Angeles, CA",
                "Las Vegas, NV",
                "Chicago, IL",
                "Seattle, WA",
                "Miami, FL"
            ];
            res.locals.signup = fs.readFileSync(Bozuko.dir+'/content/site/mailchimp-signup.html', 'utf-8');
            res.render('site/coming-soon');
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
    
    '/business' : {
        
        locals: {
            test: 'route config local'
        },
        
        title: "Bozuko for Business",
        
        get: {
            
            handler : function(req,res){
                res.render('business/index');
            }
        }
    },

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