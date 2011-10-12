var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    dateFormat = require('dateformat'),
    mailer = Bozuko.require('util/mail'),
    inspect = require('util').inspect,
    filter = Bozuko.require('util/functions').filter,
    async = require('async'),
    crypto = require('crypto');

exports.access = 'user';

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
exports.routes = {
    
    '/my/account' : {
        get : {
            handler : function(req, res){
                var user = req.session.user,
                    stats = {};
                    
                // lets stat this dude up.
                async.series([
                    
                    function total_entries(cb){
                        Bozuko.models.Entry.count({user_id: user._id}, function(error, count){
                            if( error ) return cb(error);
                            stats.entries = count;
                            return cb();
                        });
                    },
                    
                    function total_plays(cb){
                        Bozuko.models.Play.count({user_id: user._id}, function(error, count){
                            if( error ) return cb(error);
                            stats.plays = count;
                            return cb();
                        });
                    },
                    
                    function total_wins(cb){
                        Bozuko.models.Prize.count({user_id: user._id}, function(error, count){
                            if( error ) return cb(error);
                            stats.wins = count;
                            return cb();
                        });
                    },
                    
                    function total_redeemed(cb){
                        Bozuko.models.Prize.count({user_id: user._id, redeemed: true}, function(error, count){
                            if( error ) return cb(error);
                            stats.redeemed = count;
                            return cb();
                        });
                    }
                    
                ],  function finish(error){
                    res.locals.stats = stats;
                    return res.render('site/my-account');
                });
            }
        }
    },
    
    '/my/prizes' : {
        get : {
            handler : function(req, res){
                
                var user = req.session.user,
                    skip = req.param('start') || 0,
                    limit = req.param('limit') || 25,
                    state = req.param('state'),
                    query = {user_id: user._id}
                    ;
                    
                // get the count
                Bozuko.models.Prize.count(query, function(error, total){
                    if( error ) throw error;
                    // get prizes ordered by lastModified
                    Bozuko.models.Prize.find(query, {}, {skip: skip, limit: limit, sort:{timestamp:-1}}, function(error, prizes){
                        if( error ) throw error;
                        return res.send({total: total, items: prizes});
                    });
                });
            }
        }
    },
    
    '/my/friends' : {
        get : {
            handler : function(req, res){
                var user = req.session.user,
                    friend_ids = [],
                    start = parseInt(req.param('start') || 0, 10),
                    limit = parseInt(req.param('limit') || 2, 10),
                    random = req.param('random'),
                    total = 0,
                    friends = user.service('facebook').internal.friends;
                
                if( !friends.length ){
                    return res.send({});
                }
                
                var tmp = [];
                friends.forEach(function(friend){
                    tmp.push(String(friend.id));
                });
                
                // now we need to get the ids that are in our db
                return Bozuko.models.User.find({
                    'services.name':'facebook',
                    'services.sid':{$in: tmp},
                    $or: [{blocked: {$exists:false}, allowed:{$exists:false}}, {blocked: false}, {allowed: true}]
                }, {'_id':1}, {sort:{name:-1}}, function(error, friends){
                    
                    total = friends.length;
                    
                    if( random ) while( friends.length > 0 && friend_ids.length < limit){
                        var i = Math.round(Math.random()*(friends.length-1));
                        friend_ids.push(friends.splice(i,1)[0]._id);
                    }
                    
                    else{
                        friend_ids = friends.splice(start, limit);
                    }
                    
                    var fields = {
                        'services.internal.friends':0,
                        'services.internal.likes':0,
                        'services.auth':0,
                        'services.data':0,
                        'phones': 0,
                        'token': 0,
                        'salt' :0,
                        'challenge':0,
                        'can_manage_pages':0,
                        'allowed':0,
                        'blocked':0
                    };
                    
                    return Bozuko.models.User.find({_id:{$in:friend_ids}}, fields, function(error, friends){
                        if( error ) throw error;
                        if( random ) friends.sort(function(){ return -1 + (Math.random()*2) });
                        return res.send({total: total, items: friends});
                    });
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