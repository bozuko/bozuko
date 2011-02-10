var qs          = require('querystring'),
    URL         = require('url'),
    facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http');

exports.login = function(req,res,scope,defaultReturn,success,failure){
    var code = req.param('code');
    var error_reason = req.param('error_reason');
    var url = URL.parse(req.url);
   
    var params = {
        'client_id' : Bozuko.config.facebook.app.id,
        'scope' : Bozuko.config.facebook.perms[scope],
        'redirect_uri' : 'http://'+Bozuko.config.server.host+':'+Bozuko.config.server.port+url.pathname
    };
    
    if( req.session.device == 'touch'){
        params.display = 'touch';
    }
    
    if( !code && !error_reason ){
        // we need to send this person to facebook to get the code...
        var ret = req.param('return');
        req.session.redirect = ret;
        res.redirect('https://graph.facebook.com/oauth/authorize?'+qs.stringify(params));
    }
    else if( error_reason ){
        /**
         * Handle denied access
         */
        var ret = req.session.redirect || defaultReturn || '/';
        ret+= (ret.indexOf('?') != -1 ? '&' : '?')+'error_reason='+error_reason;
        
        if( failure ){
            if( failure(error_reason, req, res) === false ){
                return;
            }
        }
        
        res.redirect(ret);
    }
    else{
        
        params.client_secret = Bozuko.config.facebook.app.secret;
        params.code = code;
        
        // we should also have the user information here...
        var ret = req.session.redirect;
        
        http.request({
            url: 'https://graph.facebook.com/oauth/access_token',
            params: params,
            callback : function facebook_callback(response){
                
                var result = qs.parse(response);
                if( result['access_token'] ) {
                    // grab the access token
                    var token = result['access_token'];
                    
                    // lets get the user details now...
                    facebook.graph('/me', {
                        params:{
                            access_token : token
                        }
                    }, function(user){
                        Bozuko.models.User.findOne({facebook_id:user.id}, function(err, u){
                            if( !u ){
                                u = new Bozuko.models.User();
                            }
                            // update the user's details
                            u.name = user.name;
                            u.first_name = user.first_name;
                            u.last_name = user.last_name;
                            u.gender = user.gender;
                            u.email = user.email;
                            u.facebook_id = user.id;
                            u.facebook_auth = token;
                            u.save(function(){
                                
                                var device = req.session.device;
                                req.session.regenerate(function(err){
                                    res.clearCookie('fbs_'+Bozuko.config.facebook.app.id);
                                    req.session.userJustLoggedIn = true;
                                    req.session.user = u;
                                    req.session.device = device;
                                    if( success ){
                                        if( success(u,req,res) === false ){
                                            return;
                                        }
                                    }
                                    res.redirect(ret || '/');
                                });
                            });
                        });
                    });
                }
                else {
                    if( failure ){
                        if( failure('Authentication Failed', req, res) === false ){
                            return;
                        }
                    }
                    res.send("<html><h1>Facebook authentication failed :( </h1></html>")
                }
            },
            scope : this
        });
    }
};