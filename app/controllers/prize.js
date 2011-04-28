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
                user: "String",
				prize: "String"
            }
        },
		
		create : function( prize, user){
			var o = this.sanitize(prize);
			
			o.links = {
				prize : '/prize/'+prize.id,
				page: '/page/'+prize.page_id,
				user: '/user/'+prize.user_id
			};
			
			return this.sanitize(o, null, user);
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
		
		access: 'user',

        get : {

            access: 'user',

            handler: function(req, res) {
                var state = req.param('state');
                if (state && state != 'active' && state != 'redeemed' && state != 'expired') {
					return Bozuko.error('prize/bad_state').send(res);
                }
				var selector = {
					user_id: req.session.user.id
				};
                if( state ){
					selector.state = state;
				}
				var offset = req.param('offset') || 0;
				return Bozuko.models.Prize.find(selector, {}, {limit: 25, offset: offset, sort: {timestamp: 1}}, function(error, prizes){
					if( error ) return error.send( res );
					var ret = {
						prizes: prizes,
						next: ''
					};
					return res.send( Bozuko.transfer('prizes', ret, req.session.user));
				});
            }
        }
    },


    '/prize/:id' : {
		
		access: 'user',

		get : {
			access: 'user',

			handler: function(req, res) {
				var id = req.param('id');
				var user_id = req.session.user.id;
				var selector = {
					_id: id
				};
				
				return Bozuko.models.Prize.findOne(selector, function(error, prize){
					if( error ) return error.send(res);
					console.log(prize);
					if( !prize ){
						return Bozuko.error('prize/not_found').send(res);
					}
					
					var ret = Bozuko.transfer('prize', prize, req.session.user);
					return res.send(ret);
				});
			}
		}
	},

    '/prize/:id/redemption' : {

		post : {
			
			access: 'user',
			
			handler: function(req,res){
				// redeem the prize
				return Bozuko.models.Prize.getById(req.param('id'), function(error, prize){
					if( error ) return error.send(res);
					
					return prize.redeem(req.user, function(error, redemption){
						if( error ) return error.send(res);
						// send the redemption object
						return res.send( Bozuko.transfer('redemption_object', redemption) );
					});
				});
			}
			
		}
	}
};