var dateFormat = require('dateformat'),
    XRegExp = Bozuko.require('util/xregexp'),
    URL = require('url'),
    qs = require('querystring'),
    PrizeSchema = Bozuko.models.Prize.schema;

exports.transfer_objects = {
    prize: {
        doc: "Bozuko Prize Object - state is either active, redeemed, or expired",
        def: {
            id: "String",
            state: "String",
            name: "String",
            is_email: "Boolean",
            is_barcode: "Boolean",
            barcode_image: "String",
            page_name: "String",
            wrapper_message: "String",
            description: "String",
            win_time: "String",
            redemption_duration: "Number",
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

            o.wrapper_message = "To redeem your prize from "+prize.page.name+", "+prize.instructions+
            ". This prize expires "+dateFormat(prize.expires, 'mmmm dd yyyy hh:MM TT');
            o.win_time = prize.timestamp;
            o.business_img = prize.page.image;
            o.user_img = prize.user.image;
            /**
             * TODO - pull this from the contest / prize / page
             */
            o.redemption_duration = 60;
            if( prize.redeemed ) o.redeemed_timestamp = prize.redeemed_time;
            o.expiration_timestamp = prize.expires;

            o.links = {
                prize : '/prize/'+prize.id,
                page: '/page/'+prize.page_id,
                user: '/user/'+prize.user_id
            };

            if( o.state == 'active' ){
                o.links.redeem = '/prize/'+prize.id+'/redemption';
            }

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

exports.session = false;

exports.routes = {

    '/prizes': {

        get : {

            access: 'user',

            handler: function(req, res) {

                var state = req.param('state'),
                     query = req.param('query');

                if (state && state != PrizeSchema.ACTIVE && state != PrizeSchema.REDEEMED && state != PrizeSchema.EXPIRED) {
                    return Bozuko.error('prize/bad_state').send(res);
                }

                var selector = {
                    user_id: req.session.user.id
                };
                if( state ){
                    switch( state ){
                        case PrizeSchema.REDEEMED:
                            selector.redeemed = true;
                            break;

                        case PrizeSchema.ACTIVE:
                            selector.redeemed = false;
                            selector.expires = {$gt: new Date()};
                            break;

                        case PrizeSchema.EXPIRED:
                            selector.redeemed = false;
                            selector.expires = {$lte: new Date()};
                            break;
                    }
                }

                if( query ){
                    var re = new RegExp( '^'+XRegExp.escape( query ), 'i' );
                    selector['$or'] = [
                        {name: re},
                        {page_name: re}
                    ];
                }

                var limit = req.param('limit') || 25;
                var offset = req.param('offset') || 0;

                var url_parsed = URL.parse(req.url);
                var params = qs.parse(url_parsed.query);

                params['limit'] = limit;
                params['offset'] = offset+limit;

                var next = url_parsed.pathname+'?'+qs.stringify(params);

                return Bozuko.models.Prize.search(selector, {}, {limit: limit, offset: offset, sort: {timestamp: -1}}, function(error, prizes){
                    if( error ) return error.send( res );
                    var ret = {
                        prizes: prizes,
                        next: next
                    };
                    return res.send( Bozuko.transfer('prizes', ret, req.session.user));
                });
            }
        }
    },


    '/prize/:id' : {

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

                    if( !prize ){
                        return Bozuko.error('prize/not_found').send(res);
                    }
                    return prize.loadTransferObject( function(error, prize){
                        if( error ) return error.send(res);
                        var ret = Bozuko.transfer('prize', prize, req.session.user);
                        return res.send(ret);
                    });
                });
            }
        }
    },

    '/prize/:id/redemption' : {

        post : {

            access: 'mobile',

            handler: function(req,res){
                // redeem the prize
                return Bozuko.models.Prize.findById(req.param('id'), function(error, prize){
                    if( error ) return error.send(res);

                    return prize.redeem(req.session.user, function(error, redemption){
                    if( error ) return error.send(res);
                        // send the redemption object
                        return res.send( Bozuko.transfer('redemption_object', redemption) );
                    });
                });
            }
        }
    }
};