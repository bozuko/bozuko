var bozuko = require('bozuko');

var facebook    = bozuko.require('util/facebook'),
    http        = bozuko.require('util/http'),
    Page        = bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys')
;


exports.routes = {
    
    '/admin/logs/?' : {
        
        description :"Business login - sends user to facebook",
        
        methods     :['get'],
        
        fn : function(req,res){
            // http://nodejs.org/api.html#_child_processes
            var sys = require('sys');
            var spawn = require('child_process').spawn;
            var filename = bozuko.dir+'/logs/bozuko.log';
            
            var tail = spawn("tail", ["-f", filename]);
            
            res.writeHeader(200,{"Content-Type":"text/plain"});
            
            tail.stdout.on("data", function (data) {
                
            });
        }
    }
};