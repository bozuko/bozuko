var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    alias = Bozuko.require('core/alias'),
    inspect = require('util').inspect,
    filter = Bozuko.require('util/functions').filter,
    async = require('async'),
    facebook = Bozuko.require('util/facebook'),
    crypto = require('crypto');


exports.locals = {
    layout: 'site/layout',
    title: 'Bozuko',
    /* Force desktop rendering for now */
    device: 'desktop',
    meta: {
        'charset':'utf-8',
        'author':'Bozuko Inc.',
        'google-site-verification': 'HCG8QvNiMF-A93y538WBwu-r3dpkPYAIyfE72RpF7Cs',
        'description': 'Bozuko is the most exciting way to win prizes at your favorite places. Download and play today!',
        'keywords':[
            'instant win',
            'games',
            'geolocation',
            'android',
            'iphone',
            'game of chance',
            'lucky',
            'prizes'
        ],
        "og:image": "https://bozuko.com/images/profile-picture.png"
    },
    nav: [{
        link: '/',
        text: 'Home'
    },{
        link: '/local',
        text: 'Local'
    },{
        link: '/enterprise',
        text: 'Enterprise'
    },/*{
        link: '/mobile-app',
        text: 'Mobile App'
    },*/{
        link: '/contact',
        text: 'Contact'
    }],
    head_scripts:[
        '/js/jquery/jquery.tools.min-1.2.6.js',
        '/js/jquery/plugins/jquery.easing-1.3.js',
        '/js/modernizr/min.js',
        '/js/desktop/site/global.js'
    ],
    styles:[
        'https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,800,700,600,300',
        // Date now forces styles to refresh after a server reboot
        '/css/desktop/style.css?'+Date.now(),
        '/css/desktop/layout.css?'+Date.now()
    ]
};

exports.beforeRoute = function(){
    if( Bozuko.cfg('test_mode',true) ){
        this.locals.meta.robots = 'noindex,nofollow';
    }
};

exports.afterRoute = function(){
    var self = this,
        app = self.app;

    app.use(function(req,res){
        
        if( req.url.match(/^\/(admin|beta|listen).*/ )){
            return res.redirect('https://dashboard.bozuko.com'+req.url);
        }
        
        return self.refs.notFound(req,res);
    });

    app.error(function(err,req,res,next){
        return self.refs.notFound(req,res,next,err);
    });
};

var now = Date.now();

exports.routes = {
    
    '/' : {
        get : {

            title: 'Bozuko - Instant Win Games at your Favorite Places',
            locals: {
                html_classes: ['site-home']
            },

            handler: function(req, res) {
                res.locals.head_scripts.push('/js/desktop/site/home.js');
                res.render('site/index');
            }
        }
    },
    
    '/site/user-bar' : {
        get : {
            locals : {
                layout: false
            },
            handler : function(req, res){
                var accessToken = req.param('accessToken');
                
                function respond(){
                    res.render('site/includes/user-bar',{},function(error,  str){
                        return res.send({
                            'html' : str,
                            'user' : req.session.user ? filter(req.session.user,'_id','name') : false
                        });
                    });
                }
                
                if( accessToken ){
                    
                    // lets not replace our good token, lets just see if we can find
                    // someone
                    return Bozuko.require('util/facebook').graph('/me',{
                        params: {access_token: accessToken}
                    }, function(error, result){
                        
                        if( error || !result ){
                            return respond();
                        }
                        return Bozuko.models.User.findByService('facebook', result.id, function(error, user){
                            
                            if( error || !user ){
                                return respond();
                            }
                            req.session.user = user;
                            req.session.userJustLoggedIn = true;
                            req.session.save();
                            return respond();
                        });
                    });
                    
                }
                return respond();
            }
        }
    },
    
    '/site/logout' : {
        get : {

            handler: function(req,res){
                req.session.destroy();
                return res.redirect('/');
            }
        }
    },
    
    '/site/login' : {
        get : {

            handler: function(req,res){
                return Bozuko.service('facebook').login(
                    req,
                    res,
                    'user',
                    null,
                    function(user, req, res){
                        res.redirect('/');
                        return false;
                    }
                );
            }
        }
    },
    
    '/how-to-play' : {
        alias: '/mobile-app',
        get : {

            title: 'How to Play Bozuko',
            locals: {
                html_classes: ['site-how-to-play'],
                meta: {
                    'description' : 'Play Bozuko! The games are always fun and easy to play. Spin a slot machine or try your luck at a scratch ticket for your chance to win!'
                }
            },

            handler: function(req, res) {
                res.locals.head_scripts.push('/js/desktop/site/how-to.js');
                res.render('site/how-to-play');
            }
        }
    },
    '/local' : {
        aliases: ['/bozuko-for-business', '/bozuko-for-business/local'],
        get : {

            title: 'Bozuko for Business - Local',
            locals: {
                html_classes: ['site-b4b-local'],
                utility_bar: false,
                nav: [{
                    link: '/',
                    text: 'Home'
                },{
                    link: '/local',
                    text: 'Local'
                },{
                    link: '/enterprise',
                    text: 'Enterprise'
                }]
            },

            handler: function(req, res) {
                
                res.locals.styles.push(
                    '/css/desktop/b4b.css'
                );
                
                res.render('site/local');
            }
        }
    },
    '/enterprise' : {
        aliases: ['/bozuko-for-business/enterprise'],
        get : {

            title: 'Bozuko for Business - Enterprise',
            locals: {
                html_classes: ['site-b4b-enterprise'],
                utility_bar: false,
                nav: [{
                    link: '/',
                    text: 'Home'
                },{
                    link: '/local',
                    text: 'Local'
                },{
                    link: '/enterprise',
                    text: 'Enterprise'
                }]         
            },

            handler: function(req, res) {
                res.locals.head_scripts.push('/js/desktop/site/business.js');
                res.locals.styles.push('/css/desktop/b4b.css');
                res.render('site/enterprise');
            }
        }
    },
    '/enterprise/form' : {
        post : {
            handler: function(req, res){
                // check the form...
                var name = req.param('name'),
                    email = req.param('email'),
                    message = req.param('message'),
                    type = req.url.match(/local/) ? 'Local' : 'Enterprise',
                    success = true
                    ;

                try{
                    validator.check(name, 'Please enter your name').notEmpty();
                    validator.check(email, 'Please enter a valid email address').isEmail();
                    validator.check(message, 'Message cannot be empty').notEmpty();
                }catch(e){
                    res.locals.token = getToken(req.session, true);
                    res.locals.errors = [e.message];

                    res.locals.name = name;
                    res.locals.email = email;
                    res.locals.message = message;

                    return res.send({success:false});
                }

                // send an email...
                
                mailer.send({
                    to: 'info@bozuko.com',
                    reply_to: email,
                    subject: "New Bozuko "+type+" Inquiry",
                    body: name+' <'+email+'> sent the following message:\n\n'+message
                });
                
                return res.send({success:true});
            }
        }
    },
    '/contact' : {
        get : {

            title: 'Bozuko - Contact us',

            locals: {
                html_classes: ['contact']
            },

            handler: function(req, res){
                res.locals.token = getToken(req.session, true);
                var info = req.flash('info');
                res.locals.info = info.length ? info[0] : false;
                res.render('site/contact');
            }

        },

        post : {

            handler: function(req, res){
                // check the form...
                var name = req.param('name'),
                    email = req.param('email'),
                    message = req.param('message'),
                    token = getToken(req.session),
                    success = true
                    ;

                if( !req.param(token) ){
                    //throw Bozuko.error('bozuko/unauthorized_request');
                }
                try{
                    validator.check(name, 'Please enter your name').notEmpty();
                    validator.check(email, 'Please enter a valid email address').isEmail();
                    validator.check(message, 'Message cannot be empty').notEmpty();
                }catch(e){
                    res.locals.token = getToken(req.session, true);
                    res.locals.errors = [e.message];

                    res.locals.name = name;
                    res.locals.email = email;
                    res.locals.message = message;

                    return res.render('site/contact');
                }

                // send an email...
                mailer.send({
                    to: 'info@bozuko.com',
                    reply_to: email,
                    subject: "New Bozuko Inquiry",
                    body: name+' <'+email+'> sent the following message:\n\n'+message
                });
                req.flash('info', 'Your message is on its way!');
                return res.redirect('/contact');
            }
        }
    },
    '/business-contact': {
        get : {

            title: 'Bozuko - Contact us',

            locals: {
                html_classes: ['business-contact']
            },

            handler: function(req, res){
                res.locals.token = getToken(req.session, true);
                var info = req.flash('info');
                res.locals.info = info.length ? info[0] : false;
                res.render('site/business-contact');
            }

        },

        post : {

            handler: function(req, res){
                // check the form...
                var name = req.param('name'),
                    email = req.param('email'),
                    company = req.param('company'),
                    phone = req.param('phone'),
                    city = req.param('city'),
                    state = req.param('state'),
                    zip = req.param('zip'),
                    country = req.param('country'),
                    notes = req.param('notes')

                    token = getToken(req.session),
                    success = true
                    ;

                if( !req.param(token) ){
                    throw Bozuko.error('bozuko/unauthorized_request');
                }
                try{
                    validator.check(name, 'Please enter your name').notEmpty();
                    validator.check(email, 'Please enter a valid email address').isEmail();
                    validator.check(phone, 'Please enter your Phone Number').notEmpty();
                    validator.check(company, 'Please enter your Company Name').notEmpty();
                    validator.check(city, 'Please enter your city').notEmpty();
                    validator.check(state, 'Please enter your state').notEmpty();
                    validator.check(zip, 'Please enter a valid postal(zip) code').len(4,5);
                }catch(e){
                    res.locals.token = getToken(req.session, true);
                    res.locals.errors = [e.message];

                    res.locals.name = name;
                    res.locals.email = email;
                    res.locals.company = company;
                    res.locals.city = city;
                    res.locals.state = state;
                    res.locals.zip = zip;
                    res.locals.country = country;

                    return res.render('site/business-contact');
                }

                // send an email...
                mailer.send({
                    to: 'info@bozuko.com',
                    reply_to: email,
                    subject: "New Bozuko Business Inquiry",
                    body: name+' <'+email+'> would like to find out more.'+'\n'+
                      company+'\n'+phone+'\n'+city+', '+state+'\n'+zip+'\n'+country+'\n\n'+notes
                });
                req.flash('info', 'Your message is on its way!');
                return res.redirect('/business-contact');
            }
        }
    },
    
    '/faq' : {
        get : {
            title :'Bozuko - Frequently Asked Questions',

            locals: {
                html_classes: [
                    'faq'
                ]
            },

            handler: function(req, res){
                res.locals.head_scripts.push('/js/desktop/site/faq.js');
                res.locals.content = {
                    about:  autoLink(Content.get('site/faq/about-bozuko.md')),
                    create: autoLink(Content.get('site/faq/creating-games.md')),
                    manage: autoLink(Content.get('site/faq/management.md'))
                };
                return res.render('site/faq');
            }
        }
    },
    '/spinners' : {
        get : {
            title: 'Bozuko - Lowell Spinners',
            locals: {
                device      : 'desktop',
                html_classes: ['site-business-page'],
                head_scripts: [

                ]
            },

            handler : function(req,res){
                res.locals.content = Content.get('site/customers/spinners.html');
                return res.render('site/content');
            }
        }
    }
};

function autoLink(html){
    return html.replace(/(https?\:\/\/.*?)(<|\s|$)/gi, function(match, link, end){
        return '<a href="'+link+'" target="_blank">'+link+'</a>'+end;
    }).replace(/([^\s]+@[^\s]+\.[^\s]+?)(<|\s|$)/gi, function(match, email, end){
        return '<a href="mailto:'+email+'">'+email+'</a>'+end;
    });
}

function getToken(session, forceNew){
    var token;
    if( !session.token || forceNew ){
        session.token = crypto.createHash('sha1')
            .update( session.id + (new Date().getTime()) )
            .digest('hex');
    }
    return session.token;
}