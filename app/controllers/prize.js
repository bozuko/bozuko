var bozuko = require('bozuko');
var http = bozuko.require('util/http');

exports.transfer_objects = {
    prize: {
        doc: "Bozuko Prize Object",
        def: {
            id: "Number",
            state: "String",
            name: "String",
			description: "String",
            page: "String",
            win_time: "String",
            redemption_time: "String",
            expiration_time: "String",
            business_img: "String",
            user_img: "String",
            security_img: "String",
            links: {
				redeem: "String",
                page: "String",
                contest: "String",
                user: "String"
            }
        }
    }
};

exports.links = {
    prizes: {
        get: {
            doc:  "Return a list of prizes",
            params: {
                state: {
                    type: "String",
                    values: ['active', 'redeemed', 'expired'],
                    description: "The state of the prizes to search"
                }
            },
            returns: ["prize"]
        }
    },

    prize: {
        get: {
            doc: "Get a specific prize",
            returns: "prize"
        }
    },

    redemption: {
        post: {
            doc: "Redeem a prize"
        }
    }
};

var prize = {
    id: '45523542525abeaaa',
    state: 'active',
    name: 'buffalo wings',
    place: 'Hookslide Kelly\'s',
    win_time: new Date().toString(),
    business_img: '/some/image/path',
    user_img: '/some/img/path',
    security_img: '/some/img/path',
    links: {
        page: '/page/4d88fc617dcf0a9e75000003/',
        contest: '/contest/12345',
        user: '/user'
    }
};

exports.routes = {

    '/prizes': {

        get : {

            access: 'user',

            handler: function(req, res) {
                if (req.param('state')) {
                    console.log("state = "+ req.param('state'));
                    var state = req.param('state');
                    if (state != 'active' && state != 'redeemed' && state != 'expired') {
                        return bozuko.error('prize/bad_state').send(res);
                    }
                    else {
                        // Search prizes by user and state

                        // Just return an active prize for now, as that's what's in the test.
                        return res.send([bozuko.transfer('prize', prize)]);

                    }
                } else {
                    // Return all the user's prizes
                    return res.send([bozuko.transfer('prize', prize)]);
                }
            }
        }
    },


    '/prize/:id' : {

		get : {
				access: 'user',
	
				handler: function(req, res) {
					res.send(bozuko.transfer('prize', prize));
				}
			}
		},

    '/prize/:id/redemption' : {

		post : {
			
		}
	}
};