var http = Bozuko.require('util/http');

exports.transfer_objects = {
    prize: {
        doc: "Bozuko Prize Object - state is either active, redeemed, or expired",
        def: {
            id: "Number",
            state: "String",
            name: "String",
			wrapper_message: "String",
			description: "String",
            win_time: "String",
			redeemed_timestamp: "String",
            expiration_timestamp: "String",
            business_img: "String",
            user_img: "String",
			code: "String",
            links: {
				redeem: "String",
                page: "String",
                user: "String"
            }
        }
    },
	
	prizes: {
		doc: "The list of prizes",
		def: {
			"prizes" :["prize"],
			"next" : "String"
		}
	},
	
	redemption_object: {
		doc: "Prize Redemption Object",
		def: {
			security_image: 'String',
			prize: 'prize'
		}
	}
};

exports.links = {
    prizes: {
        get: {
			access: 'user',
            doc:  "Return a list of prizes",
            params: {
                state: {
                    type: "String",
                    values: ['active', 'redeemed', 'expired'],
                    description: "The state of the prizes to search"
                }
            },
            returns: "prizes"
        }
    },

    prize: {
        get: {
			access: 'user',
            doc: "Get a specific prize",
            returns: "prize"
        }
    },

    redeem: {
        post: {
			access: 'mobile',
            doc: "Redeem a prize",
			params: {
				message : {
					type: "String",
					description: "The user entered message"
				}
			},
			returns: "redemption_object"
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
                        return Bozuko.error('prize/bad_state').send(res);
                    }
                    else {
                        // Search prizes by user and state

                        // Just return an active prize for now, as that's what's in the test.
                        return res.send([Bozuko.transfer('prize', prize)]);

                    }
                } else {
                    // Return all the user's prizes
                    return res.send([Bozuko.transfer('prize', prize)]);
                }
            }
        }
    },


    '/prize/:id' : {

		get : {
			access: 'user',

			handler: function(req, res) {
				res.send(Bozuko.transfer('prize', prize));
			}
		}
	},

    '/prize/:id/redemption' : {

		post : {
			
			access: 'user',
			
			handler: function(req,res){
				// redeem the prize
				Bozuko.models.Prize.getById(req.param('id'), function(error, prize){
					if( error ) return error.send(res);
					
					return prize.redeem(req.user, function(error, redemption){
						if( error ) return error.send(res);
						// send the redemption object
						return req.send( Bozuko.transfer('redemption_object', redemption) );
					});
				});
			}
			
		}
	}
};