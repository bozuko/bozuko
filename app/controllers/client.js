var Facebook = Bozuko.require('util/facebook');

// exports.access = 'admin';

exports.init = function(){
    //this.app.enable('jsonp callback');
};

exports.locals = {
    layout : '/client/layout',
    device : 'desktop'
};

exports.session = false;

var now = Date.now();

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
                    'user',
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
    '/client' : {
        alias: '/client/*',
        get : {
            handler : function(req, res){
                req.session.destroy();
                res.locals.path = '/'+( req.params && req.params.length ? req.params[0] : 'api');
                
                // lets add our scripts
                var scripts = [
                    '/js/client/util/Touch.js',
                    '/js/client/util/Scroller.js',
                    '/js/client/util/Cookies.js',
                    '/js/client/util/Cache.js',
                    '/js/client/lib/Api.js',
                    '/js/client/game/Abstract.js',
                    '/js/client/game/Scratch.js',
                    '/js/client/App.js',
                ];
                
                var styles = [
                    '/css/client/animations.css',
                    '/css/client/style.css'
                ];
                
                res.locals.scripts = ['https://ajax.googleapis.com/ajax/libs/ext-core/3.1.0/ext-core.js'];
                scripts.forEach(function(script){
                    res.locals.scripts.push(script+'?'+now);
                });
                
                res.locals.stylesheets = [];
                styles.forEach(function(style){
                    res.locals.stylesheets.push(style+'?'+now);
                });
                
                return res.render('client/index');
            }
        }
    }
};