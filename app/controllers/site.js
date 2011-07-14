var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    inpsect = require('util').inspect,
    async = require('async'),
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
        link: '/how-to-play',
        text: 'How to Play'
    },{
        link: '/bozuko-for-business',
        text: 'Bozuko for Business'
    }],
    scripts:[
    ],
    styles:[
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
        self.refs.notFound(req,res);
    });

    app.error(function(err,req,res,next){
        console.error(inspect(err));
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
                console.log(res.locals.meta);
                res.render('site/index');
            }
        }
    },
    
    '/qr/:type?' : {
        get : {
            handler : function(req, res){
                var type = req.param('type');
                return res.redirect('/');
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
                    'description' : 'Play Bozuko! The games are always fun and easy to play. Spin a slot machine or try your luck at a scratch ticket for your chance to win!'
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
    '/business-contact': {
        get : {

            title: 'Bozuko - Contact us',

            locals: {
                html_classes: ['business-contact'],
                head_scripts: [
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js'
                ]
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
                    city = req.param('city'),
                    state = req.param('state'),
                    zip = req.param('zip'),
                    country = req.param('country'),

                    token = getToken(req.session),
                    success = true
                    ;

                if( !req.param(token) ){
                    throw Bozuko.error('bozuko/unauthorized_request');
                }
                try{
                    validator.check(name, 'Please enter your name').notEmpty();
                    validator.check(email, 'Please enter a valid email address').isEmail();
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
                      company+'\n'+city+', '+state+'\n'+zip+'\n'+country
                });
                req.flash('info', 'Your message is on its way!');
                return res.redirect('/business-contact');
            }
        }
    },
    '/p/:id' : {
        alias: ['/p/:id/:name'],
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
                    res.locals.title = page.name+' - Bozuko Listing';
                    return page.loadContests(null, function(error, contests){
                        // get the stupid entry method description
                        contests.forEach(function(contest){
                            contest.prizes = contest.prizes.slice().sort(function(a,b){
                                return b.value - a.value;
                            });
                        });
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