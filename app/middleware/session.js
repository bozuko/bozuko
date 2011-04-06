var parse   = require('url').parse;
var qs          = require('querystring');

module.exports = function session(){
    return function session(req, res, next){

        var path = parse(req.url).pathname;

        var ignoreExtensions = ['ico','png','jpe?g','gif','css'];
        var re = new RegExp('('+ignoreExtensions.join('|')+')$', 'i');
        if( !req.session || re.test(path) ){
            return next();
        }

        var cookie = req.cookies['fbs_'+Bozuko.config.facebook.app.id];

        var q = {};

        if (req.param('token')) {
            q.token = req.param('token');
        }
        else if( cookie ) {
            var session = qs.parse(cookie);
            q['services.name']  = 'facebook';
            q['services.sid']   = unescape(session.uid);
            q['services.auth']  = unescape(session.access_token);
        }

        var newSession = req.session.userJustLoggedIn;
        req.session.userJustLoggedIn = false;

        if( (q.token || q['services.sid']) && !newSession ){
            req.session.user = false;
            // check for the user in our database
            return Bozuko.models.User.findOne(q, function(err, u){
                if( u ){
                    req.session.user = u;
                }
                return next();
            });
        }

        else if( req.session.user ){
            // we should really grab this from the db... i think this is what is screwing up our user...
            return Bozuko.models.User.findById(req.session.user._id, function(error, user){
                req.session.user = user;
                next();
            });
        }

        else {
            return next();
        }
    };
};