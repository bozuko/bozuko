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
                var user = req.session.user;
                var email_prize_screen = req.param('email_prize_screen');

                return Bozuko.models.Prize.findById(req.param('id'), function(error, prize){
                    if( error ) return error.send(res);

                    return prize.redeem(req.session.user, email_prize_screen, function(error, redemption){

                        console.log('redemption = '+require('util').inspect(redemption));

                        if( error ) return error.send(res);

                        var message = req.param('message'),
                            share = req.param('share')
                            ;

                        if( share == 'false' ) share = false;

                        if( !share ) return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                            res.send( error || result );
                        });

                        // brag to friends
                        if( /share\s+with\s+your\s+friends/i.test(message) ) message = '';
                        // build our options
                        var options = {
                            user: req.session.user,
                            message: message,
                            link: 'https://bozuko.com/p/'+prize.page_id,
                            picture: burl('/page/'+prize.page_id+'/image')
                        };

                        // get the page
                        return Bozuko.models.Page.findById( prize.page_id, function(error, page){

                            // get the contest
                            Bozuko.models.Contest.findById( prize.contest_id, function(error, contest){

                                if( error || !page || !contest || contest.post_to_wall !== true ) return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                                    console.error('not gonna share');
                                    res.send( error || result );
                                });


                                var gameName = contest.getGame().getName();

                                var a = /^([0-9\$]|a|an|the)\s/i.test(String(prize.name)) ? '' : (String(prize.name).match(/^[aeiou]/i) ? 'an ' : 'a ');
                                options.name = req.session.user.name+' just won '+a+prize.name+'!';
                                options.description = 'You could too! Play '+gameName+' at '+page.name+' with Bozuko for your chance to win!';

                                return Bozuko.service('facebook').post(options, function(error){

                                    if( !error ){
                                        // lets save this share...
                                        var share = new Bozuko.models.Share({
                                            service         :'facebook',
                                            type            :'post',
                                            contest_id      :prize.contest_id,
                                            page_id         :prize.page_id,
                                            user_id         :prize.user_id,
                                            visibility      :0
                                        });

                                        try{
                                            share.visibility = user.service('facebook').internal.friends.length;
                                        }catch(e){
                                            share.visibility = 0;
                                        }
                                        return share.save(function(err){
                                            console.log('saved share from redeem');
                                            // send the redemption object
                                            return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                                                res.send( error || result );
                                            });
                                        });
                                    }
                                    else{
                                        return Bozuko.transfer('redemption_object', redemption, req.session.user, function(error, result){
                                            console.error('error posting to facebook wall: user_id = '+req.session.user._id+
                                                          ' user name = '+req.session.user.name);
                                            res.send( error || result );
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            }
        }
    }
};
