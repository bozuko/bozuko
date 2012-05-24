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

function no_auth(challenge, req){
    return req.session.challenge_response;
}

auth.mobile_algorithms = {
    '1.0': hashme,
    '1.1': hashme,
    '1.2': hashme,
    '1.3': hashme,
    '1.4': hashme,
    '1.5': hashme
};

auth.html5_algorithms = {
    '1.0': no_auth
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
        try{
            conn.logout();
        }catch(e){
            // no more open connections!
        }
        if( error ) {
             console.error('auth error: '+error);
             return cb(error);
        }
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

auth.developer = function(req, res, callback){
    console.log('hello');
    var api_key = req.param('api_key');
    console.log(api_key);
    return Bozuko.models.Page.count({api_key: api_key}, function(error, count){
        if( error || !count ) return callback(Bozuko.error('bozuko/auth'));
        console.log('developer passed');
        return callback();
    });
};


auth.mobile = function(req, res, callback) {


    var user = req.session.user;
    if( !user ){
        return callback(Bozuko.error('auth/user'));
    }
    if( user.isBlocked() ){
        // check to see if this user is blocked.
        return callback(Bozuko.error('user/blocked'));
    }

    async.series([

        // Verify phone type and unique id
        function(callback) {
            var version = (req.session.mobile_version||'').split('-');
            if(version.length && version[0] == 'html5'){
                return callback(null);
            }

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
            var fn, result,
                version = req.session.mobile_version.split('-',2),
                type = 'mobile';



            if( version.length > 1 ){
                type = version.shift();
                if( type == 'iphone' || type == 'android' ){
                    type = 'mobile';
                }
            }
            version = version[0];

            if ((fn = auth[type+'_algorithms'][version])) {
                result = fn(user.challenge, req);
                if (String(result) === String(req.session.challenge_response)) {
                    return callback(null);
                }
            }

            console.error('expected: '+result);
            console.error('user name: '+user.name);
            console.error('challenge: '+user.challenge);
            console.error('mobile_verion: '+req.session.mobile_version);
            console.error('challenge_response: '+req.session.challenge_response);
            console.error('req.url: '+req.url);
            console.error('failing on challenge question');

            /**
             * Disabling the authorization security on api until
             * we can figure out how it is broken
             */
            if(Bozuko.env() == 'api'){
                // alert Bozuko peeps
                Bozuko.require('util/mail').send({
                    to          :'dev@bozuko.com',
                    subject     :'Challenge Question Failure',
                    body        :[
                        'A request just failed the challenge question, here are the details:',
                        '',
                        'User Name: '+user.name,
                        'Mobile Version: '+req.session.mobile_version
                    ].join('\n')
                });
            }
            return callback(Bozuko.error('auth/mobile'));
        }

    ], function(err) {
        callback(err);
    });

};

