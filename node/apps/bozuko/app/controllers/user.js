var bozuko = require('bozuko');

var facebook    = bozuko.require('util/facebook'),
    http        = bozuko.require('util/http'),
    qs          = require('querystring')
;

var fakePrizes = {
	    active : [{name: 'buffalo wings'}],
	    redeemed : [{name: 'potato skins'}],
            expired : [{name: 'nachos'}]	
        };

exports.routes = {
    
    '/user/login' : {
        
        description :"User login - sends user to facebook",
        
        aliases     :['/login'],
        
        get : function(req,res){
            bozuko.require('auth').login(req,res,'user');
        }
    },

   '/user/:id/prizes' : {
	
	description : "Return the user's prizes",

	get : function(req, res) {
	   res.send(fakePrizes)	   	
        }
   }		

};