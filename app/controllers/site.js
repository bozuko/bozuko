var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    inspect = require('util').inspect,
    filter = Bozuko.require('util/functions').filter,
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
        link: '/beta',
        text: 'Bozuko for Business'
    }],
    head_scripts:[
        'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
        '/js/desktop/site/global.js'
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
        
        if( req.url.match(/^\/(admin|beta|listen).*/ )){
            return res.redirect('https://dashboard.bozuko.com'+req.url);
        }
        
        return self.refs.notFound(req,res);
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
                html_classes: ['site-home']
            },

            handler: function(req, res) {
                res.locals.head_scripts.push('/js/desktop/site/home.js');
                res.render('site/index');
            }
        }
    },
    
    '/qr/:type?' : {
        get : {
            
            locals : {
                device: 'touch',
                layout: false
            },
            
            handler : function(req, res){
                var type = req.param('type'),
                    ua = req.header('user-agent') || '';
                
                // figure out if this is android or iphone.
                var android = ua.match(/android/i),
                    iphone = !android && ua.match(/i(phone|pad|pod)/i);
                
                if( !android && !iphone ){
                    res.locals.redirect = '/';
                }
                else if(android){
                    // redirect to android store
                    res.locals.redirect = Bozuko.cfg('client.mobile.android.app_link','/');
                }
                else if(iphone){
                    res.locals.redirect = Bozuko.cfg('client.mobile.iphone.app_link','/');
                }
                return res.render('redirect');
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
    '/bozuko-for-business' : {
        get : {

            title: 'Bozuko for Business',
            locals: {
                html_classes: ['site-b4b']
            },

            handler: function(req, res) {
                res.locals.head_scripts.push('/js/desktop/site/b4b.js?v2');
                res.render('site/bozuko-for-business');
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
    '/p/:id' : {
        aliases: ['/p/:id/:name','/business/:id','/business/:id/:name'],
        get : {

            title: 'Bozuko - Business Listing',
            locals: {
                html_classes: ['site-business-page']
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
    '/p/:id/winners/:contest' : {
        
        get : {

            title: 'Bozuko - Winners List',
            locals: {
                html_classes: ['site-business-page']
            },

            handler: function(req, res) {
                var page, contest, prizes, winners=[], user_map={};
                
                async.series([
                    function get_pages(cb){
                        return Bozuko.models.Page.findById( req.param('id'), function(error, _page){
                            if( error ) cb(error);
                            if( !_page ) cb("No Page Found");
                            page = _page;
                            return cb();
                        });
                    },
                    function get_contests(cb){
                        return Bozuko.models.Contest.findById( req.param('contest'), function(error, _contest){
                            if( error ) cb(error);
                            if( !_contest ) cb("No Contest Found");
                            contest = _contest;
                            return cb();
                        });
                    },
                    function get_prizes(cb){
                        return Bozuko.models.Prize.find( {contest_id: req.param('contest'), page_id: req.param('id')}, {user_id: 1, name: 1,timestamp: 1}, {sort: {timestamp: 1}}, function(error, _prizes){
                            if( error ) return cb(error);
                            prizes = _prizes;
                            return cb();
                        });
                    },
                    function get_users(cb){
                        var user_ids = [];
                        prizes.forEach(function(prize){
                            user_ids.push(prize.user_id);
                        });
                        return Bozuko.models.User.find({_id: {$in:user_ids}}, {first_name: 1, last_name: 1}, function(error, _users){
                            if( error ) return cb(error);
                            _users.forEach( function(user){
                                user_map[String(user._id)] = user;
                            });
                            prizes.forEach(function(prize){
                                var winner = prize.toJSON();
                                var u = user_map[String(prize.user_id)];
                                winner.displayName = u.first_name+' '+u.last_name.substr(0,1);
                                winners.push(winner);
                            });
                            return cb();
                        });
                    }
                ], function render_page(error){
                    if( error ) throw error;
                    // lets get the contests too
                    res.locals.page = page;
                    res.locals.contest = contest;
                    res.locals.title = page.name+' - Contest '+contest._id+' Winners';
                    res.locals.winners = winners;
                    return res.render('site/contest-winners');
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
                return res.render('site/faq', 404);
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