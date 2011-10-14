var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    dateFormat = require('dateformat'),
    mailer = Bozuko.require('util/mail'),
    auth = Bozuko.require('core/auth'),
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
        'robots':'noindex,nofollow',
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
    head_scripts:[
        'https://s3.amazonaws.com/bozuko/public/scripts/jquery.tools.min.js',
        '/js/desktop/site/global.js'
    ],
    styles:[
        // Date now forces styles to refresh after a server reboot
        '/css/desktop/style.css?'+Date.now(),
        '/css/desktop/layout.css?'+Date.now(),
        '/css/desktop/my.css?'+Date.now()
    ],
    dateFormat: dateFormat
};

exports.filter = function(req, res, next){
    auth.user(req, res, function(error){
        if( req.session.user ) return next();
        return res.render('site/noauth');
    });
};

exports.routes = {
    
    '/my/account' : {
        get : {
            handler : function(req, res){
                var user = req.session.user;
                
                user.getStatistics(function(error, stats){
                    if( error ) throw error;
                    res.locals.stats = stats;
                    user.getPrizes({}, function(error, prizes, total){
                        if( error ) throw error;
                        res.locals.prizes = prizes;
                        res.locals.total_prizes = total;
                        return res.render('site/my-account');
                    });
                });
            }
        },
        
        post : {
            handler : function(req, res){
                var user = req.session.user;
                user.email = req.param('email');
                user.user_email = true;
                user.save( function(error){
                    if( error ) throw error;
                    req.flash('info', "Your settings have been saved.");
                    return res.redirect('/my/account#settings');
                });
            }
        }
    },
    
    '/my/stats' : {
        get : {
            handler : function(req, res){
                var user = req.session.user;
                
                user.getStatistics(function(error, stats){
                    if( error ) throw error;
                    res.send(stats);
                });
            }
        }
    },
    
    '/my/prizes' : {
        get : {
            handler : function(req, res){
                
                var user = req.session.user;
                    
                user.getPrizes({
                    skip        :req.param('start'),
                    limit       :req.param('limit'),
                    state       :req.param('state'),
                    sort        :req.param('sort'),
                    dir         :req.param('dir'),
                    search      :req.param('search')
                },function(error, prizes, total){
                    if( error ) throw error;
                    return res.send({total: total, items: prizes});
                });
            }
        }
    },
    
    '/my/friends' : {
        get : {
            handler : function(req, res){
                var user = req.session.user;
                user.getFriendsOnBozuko({
                    random      :true,
                    limit       :2
                },function(error, friends, total){
                    if( error ) throw error;
                    return res.send({total: total, items: friends});
                });
            }
        }
    },
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