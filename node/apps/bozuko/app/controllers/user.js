var bozuko = require('bozuko');

var facebook    = bozuko.require('util/facebook'),
    http        = bozuko.require('util/http'),
    qs          = require('querystring')
;

exports.routes = {

    '/user/login' : {

	description :"User login - sends user to facebook",

        aliases     :['/login'],

        get : function(req,res){
            bozuko.require('auth').login(req,res,'user');
        }
    },

    '/user/:id' : {

	description : "Return user properties",

	get : function(req, res) {
	    res.send({
		id: req.params.id,
		name: 'bozukob',
		first_name: 'bobby',
		last_name: 'bozuko',
		gender: 'm',
		email: 'bozukob@gmail.com',
		picture: 'http://someImageUrl',
		facebook_id: 2323423,
		can_manage_pages: 'true'
	    });
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
