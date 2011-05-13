var async = require('async'),
    ImapConnection = require('imap').ImapConnection,
    basicAuth = require('./auth/basic');

var auth = exports;

/*
 * Mobile app version security keys and algorithms
 *
 * There should be a matching key and algorithm embedded in the mobile app for each version
 */

var mobile_keys = {
    '1.0': [647, 321, 984, 1281, 519, 5127]
};

auth.mobile_algorithms = {
    '1.0': function(challenge) {
        var result;
        for (var i = 0; i < mobile_keys['1.0'].length; i++) {
            result = challenge + mobile_keys['1.0'][i];
        }
        return result;
    }
};

auth.login = function(req,res,scope,defaultReturn,success,failure){
    var service = Bozuko.service('facebook');
    service.login.apply(service, arguments);
};

auth.check = function(access, callback) {
    if (typeof(access) != 'array') {
        access = [access];
    }

    return function(req, res) {
        var layer;
        
        async.forEachSeries(access, function(layer, cb) {
            auth[layer](req, res, cb);
        }, function(err) {
            if (err) {
                console.log("err = "+err);
                return err.send(res);
            }
              // Authorization Succeeded
            return callback(req,res);
        });
    };
};

/**
 * Authorization layers
 *
 * Note: Each layer should operate independent of the order the layers are run.
 */
auth.user = function(req, res, callback) {
    if( !req.session.user ){
        return callback(Bozuko.error('bozuko/auth'));
    }
    return callback();
};

var adminAuth = basicAuth(function(user,pass,cb){
    
    // admin auth is going to be checked against our config
    // for valid email addresses (gmail or google account),
    // and then test email + pass against google's imap auth
    var email = user.toLowerCase();
    if( !~Bozuko.config.admins.indexOf(email) ){
        return cb(new Error('Email not found'));
    }
    // else, lets try to validate the password
    var conn = new ImapConnection({
        username: email,
        password: pass,
        host: 'imap.gmail.com',
        port: 993,
        secure: true
    });
    return conn.connect(function(error){
        if( error ) return cb(error);
        return cb(null, {email:email});
    });
});

/**
 * Admin auth
 */
auth.admin = function(req, res, callback ){
    /**
     * TODO - add connect middleware basic auth
     */
    return adminAuth(req,res,callback);
}


auth.business = function(req,res, callback){
    if( !req.session.user ){
        return callback(Bozuko.error('bozuko/auth'));
    }
    else if( !req.session.user.can_manage_pages ){
        return callback(Bozuko.error('bozuko/auth'));
    }
    return callback();
}


auth.mobile = function(req, res, callback) {
    
    
    var user = req.session.user;
    if( !user ){
        return callback(Bozuko.error('auth/user'));
    }
    
    async.series([

        // Verify phone type and unique id
        function(callback) {
            console.log('in async_series');
            if (!req.session.phone) return callback(Bozuko.error('auth/mobile'));
            var result = user.verify_phone(req.session.phone);
            console.log( 'result from user.verify_phone', result );
            if ( result === 'mismatch') {
                return callback(Bozuko.error('auth/mobile'));
            } else if ( result === 'match') {
                return callback();
            } else if (result === 'new') {
                return callback(Bozuko.error('auth/mobile'));
            } else {
                console.log("Unkown result from user.verify_phone: "+result);
                return callback(Bozuko.error('auth/mobile'));
            }
        },

        // Verify challenge response for the given mobile app version
        function(callback) {
            var fn, result;
            if ((fn = auth.mobile_algorithms[req.session.mobile_version])) {
                result = fn(user.challenge);
                console.log(result);
                if (String(result) === req.session.challenge_response) {
                    return callback(null);
                }
            }
            console.log('failing on challenge question');
            return callback(Bozuko.error('auth/mobile'));
        }

    ], function(err) {
        callback(err);
    });

};

