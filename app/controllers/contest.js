var S3 = Bozuko.require('util/s3');
var url = require('url');
var burl = Bozuko.require('util/url').create;
var inspect = require('util').inspect;

exports.session = false;

exports.routes = {

    '/game/:id': {

        get: {
            handler: function(req,res){

                var contest_id = req.params.id;
                var page_id = null;
                if( ~contest_id.indexOf('-') ){
                    var id_parts = contest_id.split('-');
                    contest_id = id_parts[0];
                    page_id = id_parts[1];
                }

                Bozuko.models.Contest.findById(contest_id, {results: 0, plays: 0}, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', contest_id).send(res);
                    }
                    var user = req.session.user;
                    var opts = {user: user, page_id: page_id};
                    // lets let the contest handle finding entries, etc
                    return contest.loadGameState( opts, function(error){
                        if( error ) return error.send(res);
                        var game = contest.getGame();
                        return Bozuko.transfer('game', game, user, function(error, result){
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    });
                });
            }
        }
    },

    /**
     * Play a game here. The result is pulled off the generic result list generated for the contest
     * and the index from the result is used to generate the config returned to the client.
     */
    '/game/:id/result' : {

        post: {

            access : 'mobile',

            handler : function(req,res){

                var contest_id = req.params.id;
                var page_id = null;
                if( ~contest_id.indexOf('-') ){
                    var id_parts = contest_id.split('-');
                    contest_id = id_parts[0];
                    page_id = id_parts[1];
                }

                Bozuko.models.Contest.findById(contest_id, {results:0, plays:0}, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    if( contest.state !== contest.schema.ACTIVE ){
                        return Bozuko.error('contest/inactive').send(res);
                    }

                    var opts = {
                        user: req.session.user,
                        page_id: page_id,
                        timestamp: new Date()
                    };
                    return contest.play(opts, function(error, result){
                        if( error ){
                            return error.send(res);
                        }

                        return result.contest.loadGameState( opts, function(error){
                            if( error ) return error.send(res);

                            if( result.prize ){
								return result.prize.loadTransferObject(function(error, prize){
                                    if( error ) return error.send(res);
									result.prize = prize;
                                    return Bozuko.transfer('game_result', result, req.session.user, function(error, result){

                                        // lets log what we are sending...
                                        Bozuko.publish('contest/result', {
                                            user: req.session.user.name,
                                            contest: contest.name,
                                            result: result
                                        });

                                        console.log( {
                                            user: req.session.user.name,
                                            contest: contest.name,
                                            result: result,
                                            game_result: JSON.stringify(result.result)
                                        });
                                        if (error) return error.send(res);
                                        return res.send( result );
                                    });
                                });
                            }

                            return Bozuko.transfer('game_result', result, req.session.user, function(error, result){

                                console.log( {
                                    user: req.session.user.name,
                                    contest: contest.name,
                                    result: result,
                                    game_result: JSON.stringify(result.result)
                                });

                                // lets log what we are sending...
                                Bozuko.publish('contest/result', {
                                    user: req.session.user.name,
                                    contest: contest.name,
                                    result: result
                                });
                                if (error) return error.send(res);
                                return res.send( result );
                            });
                        });
                    });
                });
            }
        }
    },

    '/game/:id/entry' : {

        post: {

            access: 'mobile',

            handler : function(req,res){
                var send = res.send,
                    user = req.session.user,
                    page_id = null,
                    contest_id = req.param('id');

                
                res.send = function(){
                    send.apply(res, arguments);
                };

                if( ~contest_id.indexOf('-') ){
                    var id_parts = contest_id.split('-');
                    contest_id = id_parts[0];
                    page_id = id_parts[1];
                }

                return Bozuko.models.Contest.findById(contest_id, {results:0, plays:0}, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    if( contest.state !== contest.schema.ACTIVE ){
                        return Bozuko.error('contest/inactive').send(res);
                    }

                    // we need to process the entry
                    var ll = req.param('ll');
                    if( !ll ){
                        return Bozuko.error('contest/game_entry_requires_ll', req.params.id).send(res);
                    }
                    var parts = ll.split(',');
                    if( parts.length != 2 ){
                        return Bozuko.error('contest/game_entry_requires_ll', req.params.id).send(res);
                    }

                    // try to get the accuracy too
                    var accuracy = req.param('accuracy');

                    parts.reverse();
                    parts[0] = parseFloat( parts[0] );
                    parts[1] = parseFloat( parts[1] );

                    var options = {
                        ll: parts,
                        accuracy: accuracy
                    };

                    page_id = page_id || contest.page_id;
                    return Bozuko.models.Page.findById( page_id, function(error, page) {
                        if( error ) return callback( error );
                        if( !page ) return callback( Bozuko.error('contest/page_not_found'));
                        options.page = page;
                        options.type = contest.getEntryConfig().type;
						options.device = req.session.mobile_version;
						options.url = req.header('Referer');
                        options.user = req.session.user;
                        options.contest = contest;

                        return user.updateInternals( function(error){
                            if ( error ) return error.send(res);

                            return Bozuko.enter(options, function(err, rv) {
                                if (err) return err.send(res);
                                return res.send(rv.game_state);
                            });
                        });
                    });
		});
            }
        }
    },

    '/game/:id/state' : {

        get: {

            handler : function(req,res){
                var contest_id = req.params.id;
                var page_id = null;
                if( ~contest_id.indexOf('-') ){
                    var id_parts = contest_id.split('-');
                    contest_id = id_parts[0];
                    page_id = id_parts[1];
                }

                return Bozuko.models.Contest.findById(contest_id, {results:0, plays:0}, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', contest_id).send(res);
                    }
                    var user = req.session.user;
                    return Bozuko.models.Page.findById(page_id, function(err, page) {
                        if (err) return callback(err);
                        if (!page) return callback(Bozuko.error('page/does_not_exist'));
                        var opts = {user: user, page: page};
                        return contest.loadGameState(opts, function(error){
                            return Bozuko.transfer('game_state', contest.game_state, user, function(error, result){
                                if (error) return error.send(res);
                                return res.send( result );
                            });
                        });
                    });
                });
            }
        }
    },
	
	'/game/:id/share' : {
		aliases: ['/game/:id/share/:src'],
        get : {
            handler : function(req, res, next){
                // find game
                return Bozuko.models.Contest.find({_id:req.param('id')}, {share_url: 1, page_id: 1, game:1}, {limit:1}, function(error, contests){
                    if( error || !contests.length ) return next();
					var contest = contests[0];
                    // do we have a share url?
                    var type = req.session.device;
					
					var default_url = burl('/p/'+contest.page_id);
					if( contest.game == 'scratch' ){
						default_url = burl('/client/game/'+contest._id+'?play=1');
					}
					
					default_url = default_url.replace(/\/api\./, '/');
					
					var redirect = default_url;
					if(type!='touch' && contest.share_url ) redirect = contest.share_url;
					/*
					 
					Well... this would be cool because we could track it in Google Analytics..
					But it introduces a nasty back button issue.
					 
					res.locals.redirect = redirect;
					res.locals.title = "Redirecting share from "+contest.name+'...';
					res.locals.device = 'touch';
					res.locals.layout = false;
					return res.render('app/redirect');
					*/
					
					// Instead, lets add our own analytics system
					var pageview = new Bozuko.models.Pageview({
						page_id			:contest.page_id,
						contest_id		:contest._id,
						timestamp		:new Date(),
						url				:req.url,
						type			:'share',
						src				:req.param('src') || 'share',
						ip				:req.connection.remoteAddress || req.connection.socket.remoteAddress
					});
					
					pageview.save();
					
					return res.redirect(redirect);
                });
            }
        }
    }
};
