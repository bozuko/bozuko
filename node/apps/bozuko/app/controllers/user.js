var bozuko = require('bozuko');

var facebook    = bozuko.require('util/facebook'),
    http        = bozuko.require('util/http'),
    qs          = require('querystring')
;

exports.routes = {

    '/user/login/:service?' : {

	description :"User login - sends user to facebook",

        aliases     :['/login/:service?'],

        get : function(req,res){
			var service = req.param('service') || 'facebook';
            bozuko.service(service).login(req,res,'user');
        }
    },

    '/user/:id' : {

		get : {
			
			doc: {
				description: "Get information about the user by their Bozuko ID",
				
				params: {
					id: {
						type: "Number",
						description: "Passed as part of the url"
					}
				},
				
				returns: {
					type: "Object",
					description: "User Object information"
				}
			},
			/**
			 * This can either be an object, or a function that returns an object,
			 * that way, you can use parameters passed to the request in the result
			 */
			example : function(req,res){
				return {
					id: req.params.id,
					name: 'bozukob',
					first_name: 'bobby',
					last_name: 'bozuko',
					gender: 'm',
					email: 'bozukob@gmail.com',
					picture: 'http://graph.facebook.com/2323423/picture',
					facebook_id: 2323423,
					can_manage_pages: 'true'
				};
			}
			
			// The real deal code would go into the "handler" function...
			/*
			handler : function(req,res){
				// real code - replaces the example object 
			}
			*/
		}
    },

    '/user/:id/prizes' : {

	description : "Return the user's prizes",

	get : function(req, res) {
	    active_prize = {
		state: 'active',
		name: 'wings',
		place: 'hookslides',
		win_time: new Date().toString(),
		expiration_time: new Date(2012, 'july', 4)
	    };
	    redeemed_prize = {
		state: 'redeemed',
		name: 'wings',
		place: 'hookslides',
		win_time: new Date().toString(),
		redemption_time: new Date(2011, 'july', 4)
	    };
	    expired_prize = {
		state: 'expired',
		name: 'wings',
		place: 'hookslides',
		win_time: new Date().toString(),
		expiration_time: new Date(2011, 'Feb', 28)
	    };

	    /* Do we want to send just one list and tag each prize with a state? */
	    res.send({
		active: [active_prize],
		redeemed: [redeemed_prize],
		expired: [expired_prize]
	    });
        }
    }

};
