var bozuko = require('bozuko');

var qs          = require('querystring'),
    URL         = require('url'),
    facebook    = bozuko.require('util/facebook'),
    http        = bozuko.require('util/http');

exports.login = function(req,res,scope,defaultReturn,success,failure){
    bozuko.service('facebook').login.apply(this, arguments);
};