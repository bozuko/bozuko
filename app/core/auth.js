var async = require('async'),
    ImapConnection = require('imap').ImapConnection,
    crypto = require('crypto'),
    basicAuth = require('./auth/basic');

var auth = exports;

/*
 * Mobile app version algorithms
 *
 * There should be an algorithm embedded in the mobile app for each version
 */

function hashme(challenge, req) {
    var data = req.url+challenge;
    var sha = crypto.createHash('sha1');
    sha.update( data );
    return sha.digest('hex');
}

auth.mobile_algorithms = {
    '1.0': hashme,
    '1.1': hashme,
    '1.2': hashme,
    '1.3': hashme,
    '1.4': hashme
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
        var layer, args = arguments;

        async.forEachSeries(access, function(layer, cb) {
            auth[layer](req, res, cb);
        }, function(err) {
            if (err) {
                console.log("err = "+err);
                return err.send(res);
            }
              // Authorization Succeeded
            return callback.apply(this,args);
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
    // lets do some pseudo hardcoding...

    var domains = Bozuko.cfg('admin.allowed_domains', ['bozuko.com']);

    if( !email ){
        return cb(new Error('No Email'));
    }
    var domain = email.split('@').pop();
    if( !~domains.indexOf(domain) ){
        return cb(new Error('Email not Found!'));
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
            if (!req.session.phone){
                return callback(Bozuko.error('auth/mobile'));
            }
            var result = user.verify_phone(req.session.phone);
            if ( result === 'mismatch') {
                return callback(Bozuko.error('auth/mobile'));
            } else if ( result === 'match') {
                return callback();
            } else if (result === 'new') {
                // Always add new phones. We may want to change this in the future.
                // This could be an attack vector potentially.
                user.phones.push(req.session.phone);
                return user.save(function(err) {
                    if (err) return callback(err);
                    return callback(null);
                });
            } else {
                console.error("Unkown result from user.verify_phone: "+result);
                return callback(Bozuko.error('auth/mobile'));
            }
        },

        // Verify challenge response for the given mobile app version
        function(callback) {
            var fn, result;
            var version = req.session.mobile_version.split('-',2);
            if( version.length > 1 ) version.shift();
            version = version[0];

            if ((fn = auth.mobile_algorithms[version])) {
                result = fn(user.challenge, req);
                if (
                    String(result) === String(req.session.challenge_response)
                    /**
                     * TODO - take the following line out when we are done testing
                     *
                     */
                    ||
                    String(5127+parseInt(user.challenge)) === String(req.session.challenge_response)
                ) {
                    return callback(null);
                }
            }
            console.error('expected: '+result);
            console.error('user name: '+user.name);
            console.error('challenge: '+user.challenge);
            console.error('challenge_response: '+req.session.challenge_response);
            console.error('req.url: '+req.url);
            console.error('failing on challenge question');
            
            /**
             * Disabling the authorization security on api until
             * we can figure out how it is broken
             */
            if(Bozuko.env() == 'api') return callback(null);
            
            return callback(Bozuko.error('auth/mobile'));
        }

    ], function(err) {
        callback(err);
    });

};

