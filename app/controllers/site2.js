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

var now = Date.now();

exports.routes = {
    
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
    
    '/facebook/tab/:page/:game' : {
        alias: '/facebook/tab/:page',
        get : {
            ref: 'facebookContest',
            title : 'Bozuko - Facebook Tab',
            handler : function(req, res){
                
                var page = req.param('page')
                  , game = req.param('game')
                  ;
                
                var parts = [page];
                if( game ) parts.push( game );
                
                return res.redirect('/client/game/'+parts.join('/')+'?play=1&facebook_tab=1');
            }
        },
        
        post : {
            handler : function(req, res){
                this.refs.facebookContest(req, res);
            }
        }
    },
    
    '/redirect' : {
        get : function(req, res, next){
            res.redirect( req.param('url') );
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