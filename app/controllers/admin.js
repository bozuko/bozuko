var facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys')
;

exports.access = 'admin';

exports.routes = {
    
    '/admin/' : {
        
        get : {
            handler: function(req,res){
                res.send('hello word');
            }
        }
    }
};