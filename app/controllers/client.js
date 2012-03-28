var async = require('async'),
    s3 = Bozuko.require('util/s3'),
    alias = Bozuko.require('core/alias'),
    Facebook = Bozuko.require('util/facebook'),
    burl = Bozuko.require('util/url').create,
    merge = Bozuko.require('util/functions').merge,
    indexOf = Bozuko.require('util/functions').indexOf;

// exports.access = 'admin';

exports.init = function(){
    //this.app.enable('jsonp callback');
};

exports.locals = {
    layout : '/client/layout',
    device : 'touch'
};

exports.session = false;

var now = Date.now();

exports.renderGame = function(req, res, contest_id, page_id){
    console.log( {contest_id: contest_id, page_id: page_id});
    
    var contest, page;
    
    contest_id = String( contest_id );
    if( page_id ) page_id = String( page_id );
    
    
    return async.series([
        
        function get_contest(cb){
            if( contest_id.alias ){
                contest = contest_id;
                return cb();
            }
            return Bozuko.models.Contest.findById(contest_id, {results: 0, plays: 0}, function(error, _contest){
                if( error ) return cb(error);
                if( !_contest ) return cb(new Error('Invalid Contest Id'));
                contest = _contest;
                return cb();
            });
        },
        
        function get_page(cb){
            
            if( page_id ){
                var pid = String(contest.page_id);
                
                if( String(contest.page_id) != pid && !~indexOf(pid, contest.page_ids) ){
                    return cb(new Error('Invalid Page Id'));
                }
            }
            else{
                page_id = contest.page_id || contest.page_ids[0];
            }
            return Bozuko.models.Page.findById(page_id, function(error, _page){
                if( error ) return cb(error);
                if( !_page ) return cb(new Error('Invalid Page'));
                page = _page;
                return cb();
            });
        }
        
    ], function render(error){
        
        if( error ){
            console.error(error);
            return res.send('error');
        }
        
        var qr = 'http://api.qrserver.com/v1/create-qr-code/?size=320x320&color=006b37&data='+encodeURIComponent(burl(req.url));
        var game = contest.getGame();
        
        if( req.session.device == 'tablet' || req.session.device == 'touch' || req.param('play') ){
            
            if( Bozuko.env() == 'site' ){
                return res.redirect('https://api.bozuko.com'+req.url);
            }
            var email_only = req.param('email_only');
            if( req.session.device != 'touch' ){
                email_only = email_only === '0' ? false : true;
            }
            if( email_only === '0' ) email_only = false;
            
            req.session.destroy();
            res.locals.email_only = email_only;
            res.locals.path = '/game/'+contest.id;
            
            // lets add our scripts
            var scripts = [
                '/js/dateFormat.js',
                '/js/client/util/Stylesheet.js',
                '/js/iscroll/iscroll-lite-4.1.6.js',
                '/js/client/util/Overrides.js',
                '/js/client/util/Touch.js',
                '/js/client/util/Scroller.js',
                '/js/client/util/Cookies.js',
                '/js/client/util/Cache.js',
                '/js/client/lib/Api.js',
                '/js/client/game/Abstract.js',
                '/js/client/game/Scratch.js',
                '/js/client/App.js'
            ];
            
            var styles = [
                '/css/client/animations.css',
                '/css/client/style.css'
            ];
            
            res.locals.meta = {};
            res.locals.meta['og:image'] = qr;
            res.locals.scripts = [
                'https://ajax.googleapis.com/ajax/libs/ext-core/3.1.0/ext-core-debug.js',
                '/js/modernizr/min.js'
            ];
            scripts.forEach(function(script){
                res.locals.scripts.push(script+'?'+now);
            });
            
            res.locals.stylesheets = [];
            styles.forEach(function(style){
                res.locals.stylesheets.push(style+'?'+now);
            });
            res.locals.html_classes = [];
            if( req.param('facebook_tab') ) res.locals.html_classes.push('facebook-tab');
            res.locals.title = 'Play '+game.getName()+'!';
            res.locals.device = 'touch';
            res.locals.layout = 'client/layout';
            res.locals.cache_time = now;
            return res.render('client/index');
        }
        // this is going to be the desktop display...
        res.locals = merge({}, Bozuko.require('controllers/site').locals);
        res.locals.meta['og:image'] = burl('/page/'+page._id+'/image');
        if( Bozuko.env() == 'site' ) res.locals.meta['og:image'] = res.locals.meta['og:image'].replace(/\/\/bozuko\.com/, '//api.bozuko.com');
        var game_type = contest.game == 'scratch' ? 'Scratch Ticket' : 'Slot Machine';
        res.locals.meta.description = "Play this "+game_type+" on your phone for a chance to win free prizes!";
        res.locals.qr = qr;
        res.locals.contest = contest;
        res.locals.game = game;
        res.locals.title = 'Play '+game.getName()+'!';
        res.locals.page = page;
        res.locals.content = contest.promo_copy;
        res.locals.short_url = burl(req.url).replace(/https?:\/\//, '').replace(/:(443|80)\//, '/');
        
        return res.render('client/game');
    });
};

exports.routes = {
    '/client/fblogin' : {
        post : {
            handler : function(req, res){
                
                var ret = {success: false};
                
                var token = req.param('token');
                if( !token ){
                    ret.params = req.body;
                    ret.noToken = true;
                    return res.send( ret );
                }
                
                var options = {params:{access_token: token}};
                
                // else lets see if we can find this guy...
                return Facebook.graph('/me', options, function(error, result){
                    
                    if( error || !result || !result.id){
                        ret.error = error;
                        return res.send(ret);
                    }
                    
                    // see if this is an existing person...
                    return Bozuko.models.User.findByService('facebook', result.id, function(error, user){
                        
                        if( error ) return res.send(ret);
                        
                        if( user ){
                            user.service('facebook').auth = token;
                            user.save();
                            return Bozuko.transfer('user', user, user, function(error, result){
                                return res.send( error || result );
                            });
                        }
                        
                        result = Bozuko.service('facebook').sanitizeUser(result);
                        
                        // lets add this dude..
                        result.token = token;
                        return Bozuko.models.User.addOrModify(result, null, function(err, u) {
                            
                            if (err) {
                                console.log("Facebook login error: "+err);
                                return err.send(ret);
                            }

                            return u.updateInternals( true, function(error){
                                if (error) {
                                    return res.send(ret);
                                }

                                req.session.user = u;

                                return Bozuko.transfer('user', u, u, function(error, result){
                                    return res.send( error || result );
                                });
                            });
                        });
                        
                    });
                    
                });
            }
        }
    },
    
    '/client/login' : {
        get : {
            handler : function(req, res){
                var redirect = req.param('redirect');
                return Bozuko.service('facebook').login(
                    req,
                    res,
                    'web',
                    redirect,
                    null,
                    function(error, req, res){
                        // we need to see what the deal is here...
                        if( error.name){
                            if( error.name == 'http/timeout' ){
                                // we should let them know what happened
                                res.locals.title = "Facebook is taking a long time...";
                                res.render('app/user/facebook_auth_timeout');
                                return false;
                            }
                            if (error.name === 'user/blocked') {
                                res.locals.title = "Access Denied";
                                res.render('app/user/blocked');
                                return false;
                            }
                        }
                        res.locals.title = ":'(";
                        res.render('app/user/permission_denied');
                        return false;
                    }
                );
            }
        }
    },
    
    '/client/blank': {
        get :{
            locals :{
                layout: false,
                device: 'desktop'
            },
            handler : function(req, res){
                return res.render('client/blank');
            }
        }
    },
    
    '/client/test' : {
        get : {
            locals : {
                layout: 'site/layout',
                device: 'desktop',
                meta: [],
                title: 'Test',
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
            },
            handler : function(req, res){
                
                res.render('client/test');
            }
        }
    },
    
    '/client/game/:page/:game' : {
        alias : '/client/game/:page',
        get : {
            handler : function(req, res){
                var self = this
                  , path = req.path.replace(/^\/client\/game\//, '');
                
                return alias.find(path, function(error, found){
                    return self.renderGame(req, res, found && found.game ? found.game._id : null, found  && found.page ? found.page._id : null );
                });
            }
        }
    },
    
    '/client/loader' : {
        get : {
            handler : function(req, res){
                res.redirect('/js/client/loader.js');
            }
        }
    },
    
    '/client/pdf' : {
        get : {
            handler : function(req, res){
                var prize, user, page;
                async.series(
                    [
                        function get_prize(cb){
                            Bozuko.models.Prize.find({},{},{sort:{timestamp:-1}}, function(error, prizes){
                                prize = prizes[0];
                                cb();
                            });
                        },
                        
                        function get_user(cb){
                            Bozuko.models.User.findById(prize.user_id,function(error, _user){
                                user = _user;
                                cb();
                            });
                        },
                        
                        function get_page(cb){
                            Bozuko.models.Page.findById(prize.page_id,function(error, _page){
                                page = _page;
                                cb();
                            });
                        }
                    ],
                    function send_pdf(){
                        
                        var security_img = page.security_img ?
                            s3.client.signedUrl('/'+page.security_img, new Date(Date.now()+(1000*60*2)) ) :
                            burl('/images/security_image.png')
                            ;
                        
                        prize.user = user;
                        prize.page = page;
                        
                        return prize.getImages(user, security_img, function(error, images){
                            
                            var pdf = prize.createPdf(user, images);
                            res.send(new Buffer(pdf, 'binary'), {'Content-Type': 'application/pdf'});
                        });
                    }
                );
            }
        }
    }
};