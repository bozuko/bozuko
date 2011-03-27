var qs          = require('querystring'),
    URL         = require('url'),
    facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http');

exports.login = function(req,res,scope,defaultReturn,success,failure){
    Bozuko.service('facebook').login.apply(this, arguments);
};