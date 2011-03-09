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
                    name: "data",
		    type: "Object",
		    description: "User Object information",

		    example : function(req){
			return {
		            id: req.params.id || '12341231412312312',
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
		}
	    }
	}
    },

    '/user/:id/prizes' : {

	get : {

            doc: {
                description: "Return a user's prize list",

                params: {
		    id: {
			type: "Number",
			description: "The id of the user"
		    },
		    filter: {
			type: "String",
			values: ['active', 'redeemed', 'expired'],
			description: "The type or types to be returned. "
			    + "Eg. /user/:id/prizes/?filter=active,redeemed"
		    }
		},

                returns: {
		    name: "prizes",
		    type: "Array",
		    description: "User Object information",

		    example: function(req, res) {
                        var links = {
                            page: '/page/4040432',
                            contest: '/contest/30345053'
                        };

			var active_prize = {
			    id: '121413123131',
			    state: 'active',
			    name: 'wings',
			    place: 'hookslides',
			    win_time: new Date().toString(),
			    expiration_time: new Date(2012, 7, 4).toString(),
                            links: links
			};

			var redeemed_prize = {
			    id: '089240823940',
			    state: 'redeemed',
			    name: 'wings',
			    place: 'hookslides',
			    win_time: new Date().toString(),
			    redemption_time: new Date(2011, 7, 4).toString(),
                            links: links
			};

                        var expired_prize = {
		            id: '089240823940',
			    state: 'expired',
			    name: 'wings',
			    place: 'hookslides',
			    win_time: new Date().toString(),
			    expiration_time: new Date(2011, 2, 28).toString(),
                            links: links
			};
			return [active_prize, redeemed_prize, expired_prize];
		    }
		}
	    }
        }
    },

    '/user/:user_id/prize/:prize_id' : {

	get : {

            doc: {
                description: "Return a specific prize",

                params: {
		    user_id: {
			type: "Number",
			description: "The id of the user"
                    },
                    prize_id: {
                        type: "Number",
                        description: "The id of the prize"
                    }
		},

                returns: {
		    name: "prize",
		    type: "Object",
		    description: "User Object information",

		    example: function(req, res) {
                        var links = {
                            page: '/page/4040432',
                            contest: '/contest/30345053',
                            user: '/user/12341234123412'
                        };

			var prize = {
			    id: '121413123131',
			    state: 'active',
			    name: 'wings',
			    place: 'hookslides',
			    win_time: new Date(),
			    expiration_time: new Date(4, 7, 2012),
                            links: links
			};

                        return prize;
		    }
		}
	    }
        }
    },

 '/user/:user_id/prize/:prize_id/redemption' : {

     get : {

         doc: {
             description: "Check the redemption status for a given prize",

                params: {
		    user_id: {
			type: "Number",
			description: "The id of the user"
                    },
                    prize_id: {
                        type: "Number",
                        description: "The id of the prize"
                    }
		},

                returns: {
		    name: "redemption_status",
		    type: "Object",
		    description: "Information about current prize redemption status",

		    example: function(req, res) {
                        var links = {
                            page: '/page/4040432',
                            contest: '/contest/30345053',
                            user: '/user/12341234123412',
                            prize: '/user/12341234123412/prize/121413123131'
                        };
                        // Don't return an image unless the prize has already been redeemed
                        // or is being redeemed with post. Not sure if this really matters or not.
			var prize = {
                            id: 121413123131,
			    state: 'active',
                            redemption_time: '',
                            expiration_time: new Date(2012, 7, 4).toString(),
			    name: 'wings',
			    place: 'hookslides',
                            img: '',
                            links: links
			};

                        return prize;
		    }
		}
	    }
        },

	post : {

            doc: {
                description: "Redeem a prize",

                params: {
		    user_id: {
			type: "Number",
			description: "The id of the user"
                    },
                    prize_id: {
                        type: "Number",
                        description: "The id of the prize"
                    }
		},

                returns: {
		    name: "redemption_object",
		    type: "Object",
		    description: "Information used to create the redemption screen",

		    example: function(req, res) {
                        var links = {
                            page: '/page/4040432',
                            contest: '/contest/30345053',
                            user: '/user/12341234123412',
                            prize: '/user/12341234123412/prize/121413123131'
                        };

			var prize = {
                            id: 121413123131,
			    state: 'redeemed',
                            redemption_time: new Date().toString(),
                            expiration_time: new Date(2012, 7, 4).toString(),
			    name: 'wings',
			    place: 'hookslides',
                            img: '/page/4040432/daily/img',
                            links: links
			};

                        return prize;
		    }
		}
	    }
        }
    }

};
