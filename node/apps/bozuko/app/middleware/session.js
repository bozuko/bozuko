var bozuko = require('bozuko');

var qs          = require('querystring');

var HEADER = {
    user_id        : 'BOZUKO_FB_USER_ID',
    access_token   : 'BOZUKO_FB_ACCESS_TOKEN'
};

module.exports = function session(){
    return function session(req, res, next){
        var uid, token;
        var cookie = req.cookies['fbs_'+bozuko.config.facebook.app.id];
        
        var q = {facebook_id:null};
        
        if( req.header(HEADER.user_id) ){
            // need to run these through unescape because of how
            // they are retrieved in corona
            q.facebook_id = unescape(req.header(HEADER.user_id));
            q.facebook_auth = unescape(req.header(HEADER.access_token));
        }
        
        else if( cookie ){
            var session = qs.parse(cookie);
            q.facebook_id = session.uid;
            q.facebook_auth = session.access_token;
        }
        
        if( !req.session.userJustLoggedIn && (req.session.user === undefined || q.facebook_id != req.session.user.facebook_id) ){
            req.session.user = false;
            if( q.facebook_id ){
                // check for the user in our database
                bozuko.models.User.findOne(q,function(err, u){
                    if( u ){
                        req.session.user = u;
                    }
                    next();
                });
            }
            else{
                next();
            }
            
        }else{
            req.session.userJustLoggedIn = false;
            next();
        }
        
    }
};