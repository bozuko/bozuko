var XRegExp = Bozuko.require('util/xregexp'),
    URL = require('url'),
    burl = Bozuko.require('util/url').create,
    qs = require('querystring'),
    PrizeSchema = Bozuko.models.Prize.schema;

exports.session = false;

exports.routes = {

    '/prizes': {

        get : {

            access: 'user',

            handler: function(req, res) {

                var state = req.param('state'),
                    query = req.param('query'),
                    page_id = req.param('page_id'),
                    game_id = req.param('game_id')
                    ;

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
                
                if( game_id ){
                    selector.contest_id = game_id;
                }
                if( page_id ){
                    selector.page_id = page_id;
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
                            if (error) return error.send(res);
                            return res.send( result );
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
                            if (error) return error.send(res);
                            return res.send( result );
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
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    });
                });
            }
        }
    },
    
    '/prize/:id/share' : {
        post : {
            access : 'user',
            
            handler : function(req, res){
                var user = req.session.user;
                var message = req.param('message');
                return Bozuko.models.Prize.findById(req.param('id'), function(error, prize){
                    if( error ) return error.send(res);
                    return prize.share({
                        user: user,
                        message: message
                    }, function(error){
                        if( error ) return error.send(res);
                            
                        return Bozuko.transfer('success_message', {
                            success: true,
                            title: 'Thanks for Sharing!',
                            message: 'Your win has been posted to your Facebook wall.'
                        }, req.session.user, function(error, result){
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    });
                });
            }
        }
    },
    
    '/prize/:id/resend' : {
        post : {
            access : 'mobile',
            
            handler : function(req, res){
                var user = req.session.user;
                
                var options = {
                    query           :{
                        _id             :req.param('id')
                    },
                    limit : 1
                };
                
                user.getPrizes(options, function(error, prizes){
                    if( error ) return error.send(res);
                    if( !prizes.length ) return Bozuko.error('prize/not_exists').send(res);
                    
                    prizes[0].sendEmail(user);                    
                    return Bozuko.transfer('success_message', {
                        
                        success: true,
                        message: 'Email resent successfully',
                        title: 'Email Resent'
                        
                    }, user, function(error, result){
                        return res.send(error || result);
                    })
                    
                });
            }
        }
    },

    '/prize/:id/redemption' : {

        post : {

            access: 'mobile',

            handler: function(req,res){
                var user = req.session.user;
                var email_prize_screen = req.param('email_prize_screen');

                return Bozuko.models.Prize.findById(req.param('id'), function(error, prize){
                    if( error ) return error.send(res);

                    return prize.redeem(req.session.user, email_prize_screen, function(error, redemption){

                        if( error ) return error.send(res);

                        var message = req.param('message'),
                            share = req.param('share')
                            ;

                        if( share == 'false' ) share = false;
                        

                        if( !share ) return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                            return res.send( error || result );
                        });
                        
                        // brag to friends
                        if( /share\s+with\s+your\s+friends/i.test(message) ) message = '';
                        
                        return prize.share({
                            user: user,
                            message: message
                        }, function(error){
                            
                            /**
                             * Fuck it - if they didn't accept Facebook Permissions, whatever.
                             */
                            // if( error ) return error.send(res);
                            
                            return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                                
                                if (error) return error.send(res);
                                return res.send( result );
                                
                            });
                        });
                    });
                });
            }
        }
    }
};
