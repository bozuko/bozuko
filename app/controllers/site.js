var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    crypto = require('crypto');


exports.locals = {
    layout: 'site/layout',
    title: 'Bozuko',
    meta: {
        'google-site-verification': 'HCG8QvNiMF-A93y538WBwu-r3dpkPYAIyfE72RpF7Cs',
        'description': 'Bozuko is the most exciting way to win prizes at your favorite places. Download and play today!',
        'robots' : 'noindex,nofollow',
        'keywords':[
            'instant win',
            'games',
            'geolocation',
            'android',
            'iphone',
            'game of chance',
            'lucky',
            'prizes'
        ]
    },
    nav: [{
        link: '/',
        text: 'Home'
    },{
        link: '/how-to-play',
        text: 'How to Play'
    },{
        link: '/bozuko-for-business',
        text: 'Bozuko for Business'
    }],
    scripts:[
    ]
};

exports.init = function(){
    var self = this,
        app = self.app;
        
    app.use(function(req,res){
        self.refs.notFound(req,res);
    });
    
    app.error(function(err,req,res,next){
        return self.refs.notFound(req,res,next,err);
    });
};

exports.routes = {
    '/' : {
        get : {
            
            title: 'Bozuko - Instant Win Games at your Favorite Places',
            locals: {
                html_classes: ['site-home'],
                head_scripts: [
                    
                ]
            },
            
            handler: function(req, res) {
                res.render('site/index');
            }
        }
    },
    '/how-to-play' : {
        get : {
            
            title: 'How to Play Bozuko',
            locals: {
                html_classes: ['site-how-to-play'],
                head_scripts: [
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
                    '/js/desktop/site/how-to.js'
                ],
                meta: {
                    'description' : 'Playing Bozuko is fun and easy. Learn about how to find Bozuko Places and play their games for a chance to win prizes instantly!'
                }
            },
            
            handler: function(req, res) {
                res.render('site/how-to-play');
            }
        }
    },
    '/bozuko-for-business' : {
        get : {
            
            title: 'Bozuko for Business',
            locals: {
                html_classes: ['site-b4b'],
                head_scripts: [
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
                    '/js/desktop/site/b4b.js'
                ]
            },
            
            handler: function(req, res) {
                res.render('site/bozuko-for-business');
            }
        }
    },
    '/contact' : {
        get : {
            
            title: 'Bozuko - Contact us',
            
            locals: {
                html_classes: ['contact'],
                head_scripts: [
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js'
                ]
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
                    throw Bozuko.error('bozuko/unauthorized_request');
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
    '/p/:id' : {
        get : {
            
            title: 'Bozuko - Business Listing',
            locals: {
                html_classes: ['site-business-page'],
                head_scripts: [
                    
                ]
            },
            
            handler: function(req, res) {
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error || !page ){
                        res.locals.page = null;
                        return res.render('site/business-page');
                    }
                    // lets get the contests too
                    res.locals.page = page;
                    return page.loadContests(null, function(error, contests){
                        res.locals.contests = contests;
                        return res.render('site/business-page');
                    });
                });
            }
        }
    },
    '/404' : {
        get : {
            ref: 'notFound',
            
            title :'Bozuko - Page not found',
            
            locals: {
                html_classes: [
                    'cityscape'
                ]
            },
            
            handler: function(req, res, next, err){
                if(err){
                    res.locals.err = err;
                    res.locals.title = err.title;
                    return res.render('site/error', err.code)
                }
                return res.render('site/404', 404);
            }
        }
    },
    '/about' : {
        get : {
            title :'Bozuko - About',
            
            locals: {
                content: Content.get('site/about.md')
            },
            
            handler: function(req, res){
                res.locals.content = Content.get('site/about.md');
                return res.render('site/content', 404);
            }
        }
    },
    
    '/privacy-policy' : {
        get : {
            title :'Bozuko - Privacy Policy',
            
            locals: {
                html_classes: [
                    'legal'
                ],
                content: Content.get('site/privacy.md')
            },
            
            handler: function(req, res){
                res.locals.content = Content.get('site/privacy.md');
                return res.render('site/content', 404);
            }
        }
    },
    
    '/terms-of-use' : {
        get : {
            title :'Bozuko - Terms of Use',
            
            locals: {
                html_classes: [
                    'legal'
                ],
                content: Content.get('site/terms.md')
            },
            
            handler: function(req, res){
                res.locals.content = Content.get('site/terms.md');
                return res.render('site/content', 404);
            }
        }
    },
    'twitter/widget.js' : {
        get: {
            handler :  function(req,res){
                res.contentType = 'text/javascript';
                require('http').get({
                        host: 'widgets.twimg.com',
                        port: 80,
                        path: '/j/2/widget.js'
                    }, function(response){
                    response.setEncoding('utf-8');
                    response.on('data', function(chunk){
                        res.write(chunk, 'utf-8');
                    });
                    response.on('end', function(){
                        res.end();
                    });
                });
            }
        }
    }
};

function getToken(session, forceNew){
    var token;
    if( !session.token || forceNew ){
        session.token = crypto.createHash('sha1')
            .update( session.id + (new Date().getTime()) )
            .digest('hex');
    }
    return session.token;
}