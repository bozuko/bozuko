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
    '/client' : {
        alias: '/client/*',
        get : {
            handler : function(req, res){
                res.locals.path = '/'+( req.params && req.params.length ? req.params[0] : 'api');
                return res.render('client/index');
            }
        }
    },
    '/client/fblogin' : {
        post : {
            handler : function(req, res){
                
                var ret = {success: false};
                
                var token = req.param('token');
                if( !token ){
                    return res.send( ret );
                }
                // else lets see if we can find this guy...
                return Facebook.api('/me', {params:{
                    access_token: token
                }}, function(error, result){
                    
                    if( error || !result ) return res.send(ret);
                    
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
    }
};