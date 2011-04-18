var qs          = require('querystring'),
    URL         = require('url'),
    facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http');

var auth = exports;

auth.login = function(req,res,scope,defaultReturn,success,failure){
    var service = Bozuko.service('facebook');
    service.login.apply(service, arguments);
};

auth.check = function(access, handler) {
    if (typeof(access) === 'Array') {
        return function(req, res) {
            var layer;
            while (layer = access.unshift()) {
                if ( !auth[layer](req, res) ) {
                    // Authorization Failed
                    return;
                }
            }
            // Authorization Succeeded
            return handler(req,res);
        };
    } else {
        return function(req, res) {
            if (auth[access](req, res)) {
                return handler(req, res);
            }
        };
    }
};

/**
 * Authorization layers
 *
 * Note: Each layer should operate independent of the order the layers are run.
 */
auth.user = function(req, res) {
    if( !req.session.user ){
        Bozuko.error('bozuko/auth').send(res);
        return false;
    }
    return true;
};

auth.mobile = function(req, res) {
    return true;
};