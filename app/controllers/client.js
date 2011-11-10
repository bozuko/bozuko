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
                // else lets see if we can find this guy...
                return Facebook.graph('/me', {params:{
                    access_token: token
                }}, function(error, result){
                    
                    if( error || !result ){
                        ret.error = error;
                        return res.send(ret);
                    }
                    
                    // see if this is an existing person...
                    return Bozuko.models.User.findByService('facebook', result.id, function(error, user){
                        
                        if( error ) return res.send(ret);
                        
                        return Bozuko.transfer('user', user, user, function(error, result){
                            res.send( error || result );
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
                return res.render('client/index');
            }
        }
    }
};