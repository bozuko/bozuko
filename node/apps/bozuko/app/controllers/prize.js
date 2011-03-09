var bozuko = require('bozuko');
var http = bozuko.require('util/http');

exports.routes = {

    '/prize/:id' : {

	get : {

            doc: {
                description: "Return a specific prize",

                params: {
	            id: {
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

    '/prize/:id/redemption' : {

        get : {

            doc: {
                description: "Check the redemption status for a given prize",

                params: {
                    id: {
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
                            prize: '/prize/121413123131'
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
                            prize: '/prize/121413123131'
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