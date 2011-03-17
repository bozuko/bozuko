var bozuko  = require('bozuko'),
    parse   = require('url').parse
    ;

var qs          = require('querystring');

var HEADER = {
    user_id        : 'BOZUKO_FB_USER_ID',
    access_token   : 'BOZUKO_FB_ACCESS_TOKEN'
};

module.exports = function session(){
    return function session(req, res, next){

        var path = parse(req.url).pathname;

        var ignoreExtensions = ['ico','png','jpe?g','gif','css'];
        var re = new RegExp('('+ignoreExtensions.join('|')+')$', 'i');
        if( re.test(path) ){
            return next();
        }

        var uid, token;
        var cookie = req.cookies['fbs_'+bozuko.config.facebook.app.id];

        var q = {};

        if( req.header(HEADER.user_id) ){
            // need to run these through unescape because of how
            // they are retrieved in corona
            q['services.name']  = 'facebook';
            q['services.id']    = (req.header(HEADER.user_id));
            q['services.auth']  = (req.header(HEADER.access_token));
            
            console.log(q);
        }

        else if( cookie ){
            var session = qs.parse(cookie);
            q['services.name']  = 'facebook';
            q['services.id']    = unescape(session.uid);
            q['services.auth']  = unescape(session.access_token);
        }

        if( req.session.user ){
            // need to populate this bad boy
            req.session.user = new bozuko.models.User(req.session.user);
        }

        if( !req.session.userJustLoggedIn && (!req.session.user || (req.session.user.service('facebook') && q['services.id'] != req.session.user.service('facebook').id)) ){
            req.session.user = false;
            if( q['services.id'] ){
                // check for the user in our database
                bozuko.models.User.findOne(q, function(err, u){
                    if( u ){
                        req.session.user = u;
                    }
                    return next();
                });
            }
            else{
                return next();
            }

        }else{
            if( req.session ) req.session.userJustLoggedIn = false;
            return next();
        }

    }
};