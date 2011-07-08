var dateFormat = require('dateformat'),
    XRegExp = Bozuko.require('util/xregexp'),
    URL = require('url'),
    burl = Bozuko.require('util/url').create,
    qs = require('querystring'),
    PrizeSchema = Bozuko.models.Prize.schema;

exports.transfer_objects = {
    prize: {
        doc: "Bozuko Prize Object - state is either active, redeemed, or expired",
        def: {
            id: "String",
            game_id: "String",
            page_id: "String",
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

        create : function( prize, user, callback){
            var self = this;
            this.sanitize(prize, null, user, function(error, o){
                if( error ) return callback( error );
                o.page_id = prize.page_id;
                o.game_id = prize.contest_id;
                o.wrapper_message = "To redeem your prize from "+prize.page.name+": "+prize.instructions+
                    " This prize expires "+dateFormat(prize.expires, 'mmmm dd yyyy hh:MM TT');
                o.win_time = prize.timestamp;
                o.business_img = prize.page.image;
                o.user_img = prize.user.image.replace(/type=large/, 'type=square');
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
                return self.sanitize(o, null, user, function(error, result){
                    if( error ) return callback( error );
                    return callback(null, result);
                });
            });
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
                },
                share : {
                    type: "Boolean",
                    description: "Share this redemption."
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

                return Bozuko.models.Prize.count(selector, function(error, count){
                    if( error ) return error.send( res );
                    
                    if( !count ){
                        return Bozuko.transfer('prizes', {
                            prizes: []
                        }, req.session.user, function(error, result){
                            res.send( error || result );
                        });
                    }
                    
                    var hasNext = offset+limit <= count;
                    
                    return Bozuko.models.Prize.search(selector, {}, {limit: limit, skip: offset, sort: {timestamp: -1}}, function(error, prizes){
                        if( error ) return error.send( res );
                        var ret = {
                            prizes: prizes
                        };
                        if( hasNext ) ret.next = next;
                        return Bozuko.transfer('prizes', ret, req.session.user, function(error, result){
                            console.log(result);
                            res.send( error || result );
                        });
                    });
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
                        return Bozuko.transfer('prize', prize, req.session.user, function(error, result){
                            res.send( error || result );
                        });
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
                    
                        var message = req.param('message'),
                            share = req.param('share')
                            ;
                            
                        if( share == 'false' ) share = false;
                            
                        if( (!share) || Bozuko.cfg('test_mode', true) ) return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                            res.send( error || result );
                        });
                        
                        // brag to friends
                        if( /share\s+with\s+your\s+friends/i.test(message) ) message = '';
                        // build our options
                        var options = {
                            user: req.session.user,
                            message: message,
                            link: 'http://bozuko.com',
                            picture: burl('/page/'+prize.page_id+'/image')
                        };
                        
                        // get the page
                        return Bozuko.models.Page.findById( prize.page_id, function(error, page){
                           
                            // get the contest
                            Bozuko.models.Contest.findById( prize.contest_id, function(error, contest){
                                
                                if( !page || !contest || contest.post_to_wall !== true ) return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                                    res.send( error || result );
                                });
                                
                                // finish up the options
                                
                                var a = /^(a|an|the)\s/i.test(String(prize.name)) ? '' : (String(prize.name).match(/^[aeiou]/i) ? 'an ' : 'a ');
                                options.name = req.session.user.name+' just won '+a+prize.name+'!';
                                options.description = 'You could too! Play Bozuko at '+page.name+' for your chance to win!';
                                
                                return Bozuko.service('facebook').post(options, function(error){
                                    
                                    // if there is an error, we don't need to frighten the user,
                                    // lets just log it and move on.
                                    
                                    // send the redemption object
                                    return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                                        res.send( error || result );
                                    });
                                });
                                
                            });
                            
                        });
                    });
                });
            }
        }
    }
};
