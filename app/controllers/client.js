var async = require('async'),
    fs = require('fs'),
    s3 = Bozuko.require('util/s3'),
    alias = Bozuko.require('core/alias'),
    Facebook = Bozuko.require('util/facebook'),
    burl = Bozuko.require('util/url').create,
    merge = Bozuko.require('util/functions').merge,
    jsp = require('uglify-js').parser,
    pro = require('uglify-js').uglify,
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
        
        var share = contest.get('share_url')
          , redirect_url = contest.get('redirect_url')
          , start = contest.get('start')
          , change_time = new Date('2012-07-30 12:00:00')
          , facebook_crawler = req.headers && req.headers['user-agent'] && req.headers['user-agent'].match(/facebookexternalhit/i)
          , facebook_referer = req.headers && req.headers['referer'] && req.headers['referer'].match(/facebook.com/i)
          ; 
          
        //console.log('referer: '+req.headers['user-agent']);
          
        if( !req.headers || !req.headers['user-agent'] || !req.headers['user-agent'].match(/facebookexternalhit/i) ){
            if( !req.param('play') && share ){
                // return res.redirect( share );
            }
            
            if( !req.param('play') && ((req.session.device == 'tablet' && !facebook_referer) || req.session.device == 'desktop') && redirect_url ){
                return res.redirect( redirect_url );
            }
        }
           
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
        
        
        var Game = contest.game;
        Game = Game.substr(0,1).toUpperCase() + Game.substr(1);
        
        // lets add our scripts
        var scripts = [
            '/js/ext-core/ext-core.js',
            '/js/modernizr/min.js',
            '/js/dateFormat.js',
            '/js/client/util/Stylesheet.js',
            '/js/iscroll/iscroll-lite-4.1.6.js',
            '/js/client/util/Overrides.js',
            '/js/client/util/ISODate.js',
            '/js/client/util/Touch.js',
            '/js/client/util/Scroller.js',
            '/js/client/util/Cookies.js',
            '/js/client/util/Cache.js',
            '/js/client/lib/Api.js',
            '/js/client/game/Abstract.js',
            '/js/client/game/'+Game+'.js',
            '/js/client/App.js'
        ];
        
        var styles = [
            '/css/client/animations.css',
            '/css/client/style.css'
        ];
        
        res.locals.meta = {};
        // res.locals.meta['og:image'] = qr;
        
        // get the sharing
        res.locals.meta['og:type'] = 'website';
        res.locals.meta['og:url']  = burl(req.url);
        res.locals.meta['og:image'] = burl('/page/'+page.id+'/image');
        res.locals.meta['og:title'] = contest.share_title || game.getName();
        res.locals.meta['og:description'] = contest.share_description || Bozuko.t('en', 'game/share_description', game.getName());
        
        var add_scripts = function(cb){
            
            // get the name...
            var name='';
            scripts.forEach(function(script){
                name+=script;
            });
            
            var filename = require('crypto').createHash('md5').update(name).digest("hex") + '.js';
            
            if( !Bozuko.proc.worker.master.min ) Bozuko.proc.worker.master.min = {};
            
            // minify
            
            
            
            if( !Bozuko.proc.worker.master.min[filename] ){
                var code='';
                scripts.forEach(function(script){
                    code+=fs.readFileSync(Bozuko.dir+'/app/static'+script);
                });
                
                var ast = jsp.parse(code);
                ast = pro.ast_mangle(ast);
                ast = pro.ast_squeeze(ast);
                
                fs.writeFileSync( Bozuko.dir+'/tmp/'+filename, pro.gen_code(ast), 'utf-8');
                // s3
                return Bozuko.require('util/s3').client.deleteFile('/js/min/'+filename, function(){
                    return Bozuko.require('util/s3').put(Bozuko.dir+'/tmp/'+filename,'/js/min/'+filename,{
                        'x-amz-acl':'public-read',
                        'Content-Type': 'text/javascript'
                    }, function(err, r){
                        if( err ) console.error( err );
                        Bozuko.proc.worker.master.min[filename] = true;
                        res.locals.scripts = ['https://'+Bozuko.require('util/s3').client.endpoint+'/js/min/'+filename];
                        cb();
                    });
                });
                
            }
            res.locals.scripts = ['https://'+Bozuko.require('util/s3').client.endpoint+'/js/min/'+filename];
            return cb();
            
        }
        
        var add_styles = function(cb){
            res.locals.stylesheets = [];
            styles.forEach(function(style){
                //http://bozuko.s3.amazonaws.com/app/css/client/style.css
                res.locals.stylesheets.push('https://bozuko.s3.amazonaws.com/app'+style);
            });
            cb();
        }
        
        return add_scripts(function(){
            return add_styles(function(){
                res.locals.html_classes = [];
                if( req.param('facebook_tab') ) res.locals.html_classes.push('facebook-tab');
                res.locals.title = 'Play '+game.getName()+'!';
                res.locals.device = 'touch';
                res.locals.layout = 'client/layout';
                res.locals.cache_time = now;
                res.locals.contest = contest;
                res.locals.page = page;
                var o;
                if( contest.game_config && (o=contest.game_config.theme_options) ){
                    if(o.js){
                        res.locals.theme_js = o.js;
                    }
                    if(o.css){
                        return require('less').render( o.css, function(error, css){
                            
                            if( css ) res.locals.theme_css = css;
                            else res.locals.theme_css = '/*\n'+error.stack+'\n*/';
                            return res.render('client/index');
                        });
                        
                    }
                }
                return res.render('client/index');
            });
        });
        
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