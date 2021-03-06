var S3 = Bozuko.require('util/s3');
var url = require('url');
var path = require('path');
var burl = Bozuko.require('util/url').create;
var inspect = require('util').inspect;
var async = require('async');
var Report      = Bozuko.require('core/report');
var ObjectId    = require('mongoose').Types.ObjectId;

exports.session = false;

exports.routes = {

    '/game/:id?': {

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
        },
		
		put : {
            
            access : 'developer_private',
            handler : function(req, res){
                
                Bozuko.models.Contest.apiCreate(req, function(error, game){
					var noop=function(opts, cb){ return cb(); };
					return (game ? game.loadGameState : noop).call(game, {user:null, page_id: game ? game.page_id : null}, function(e){
						
						if( error ) console.log(error.stack);
						
						var t = {
							success: error ? false : true,
							errors: error ? error.errors() : undefined,
							error: error ? error.message : undefined,
							game: game ? game.getGame() : undefined
						};
						
						Bozuko.transfer('game_save_result', t, req.session.user, function(error, result){ 
							if (error) return error.send(res);
							return res.send( result );
						});
					});
                });
                
            }
        },
		
		post : {
			
			access : 'developer_private',
			handler : function(req, res){
				Bozuko.models.Contest.apiUpdate(req, function(error, game){
					var noop=function(opts, cb){ return cb(); };
					return (game ? game.loadGameState : noop).call(game, {user:null, page_id: game ? game.page_id : null}, function(e){
						
						var t = {
							success: error ? false : true,
							errors: error ? error.errors() : undefined,
							error: error ? error.message : undefined,
							game: game ? game.getGame() : undefined
						};
						
						Bozuko.transfer('game_save_result', t, req.session.user, function(error, result){ 
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
	
	'/game/:id/publish' : {
		
		post : {
			access : 'developer_private',
			handler : function( req, res ){
				// get the game
				Bozuko.models.Contest.findById( req.param('id'), function(error, contest){
					if(error) return error.send(res);
					if(!contest) return Bozuko.transfer('game_publish_result', {
						error: 'Game not found',
						success: false
					}, null, function(error, result){
						return res.send(error||result);
					});
					if(contest.state != 'draft') return Bozuko.transfer('game_publish_result', {
						error: 'Game already published',
						success: false
					}, null, function(error, result){
						return res.send(error||result);
					});
					return contest.loadGameState({user:null, page_id:contest.page_id}, function(error){
						if(error) return error.send(res);
						return contest.publish(function(error){
							return Bozuko.transfer('game_publish_result', {
								error: error ? error.message : null,
								success: error ? false : true,
								game : error ? null : contest
							}, null, function(error, result){
								return res.send(error||result);
							});
						});
					});
				});
			}
		}
	},
	
	'/game/:id/cancel' : {
		
		post : {
			access : 'developer_private',
			handler : function( req, res ){
				// get the game
				Bozuko.models.Contest.findById( req.param('id'), function(error, contest){
					if(error) return error.send(res);
					if(!contest) return Bozuko.transfer('game_cancel_result', {
						error: 'Game not found',
						success: false
					}, null, function(error, result){
						return res.send(error||result);
					});
					if(contest.state != 'active' && contest.state != 'published') return Bozuko.transfer('game_cancel_result', {
						error: 'Cannot cancel',
						success: false
					}, null, function(error, result){
						return res.send(error||result);
					});
					return contest.loadGameState({user:null, page_id:contest.page_id}, function(error){
						if(error) return error.send(res);
						return contest.cancel(function(error){
							return Bozuko.transfer('game_cancel_result', {
								error: error ? error.message : null,
								success: error ? false : true,
								game : error ? null : contest
							}, null, function(error, result){
								return res.send(error||result);
							});
						});
					});
				});
			}
		}
	},
	
	'/game/:id/codes' : {
		get : {
			access : 'developer_private',
			handler : function( req, res ){
				// get the game
				var codes = {
						count: 0,
						limit: req.param('limit') || 100,
						offset: req.param('offset') || 0,
						codes: []
					}
				  , code = req.param('code')
				  , prize_id = req.param('prize_id')
				  , selector = {}
				
				if( code ) selector.code = code;
				
				var send_codes = function(){
					return Bozuko.transfer('game_prize_codes', codes, null, function(error, result){
						return res.send(error||result);
					});
				};
				
				return Bozuko.models.Contest.findOne( {
					_id: req.param('id'),
					apikey_id: req.apikey._id
				},{results: 0}, function(error, contest){
					if(error) return error.send(res);
					
					// got it...
					if( !contest ) return send_codes();
					
					selector.contest_id = contest._id;
					
					if( prize_id ) contest.prizes.forEach(function(p,i){
						if( String(p.id) == prize_id ) selector.index = i;
					});
					
					// get the prizes for this contest...
					return Bozuko.models.Result.count(selector, function(error, count){
						codes.count = count;
						return Bozuko.models.Result.find(selector, {}, {sort: {timestamp:1}, limit: codes.limit, skip: codes.offset}, function(error, results){
							var ret = [];
							results.forEach(function(r){
								var code = {code: r.code, prize_id: contest.prizes[r.index]._id};
								if( r.win_time ) code.win_time = r.win_time;
								ret.push(code);
							});
							codes.codes = ret;
							return send_codes();
						});
					});
				});
			}
		}
	},
	
	'/game/:id/wins' : {
		get : {
			access : 'developer_private',
			handler : function( req, res ){
				// get the game
				var ret = {
						count: 0,
						limit: req.param('limit') || 100,
						offset: req.param('offset') || 0,
						wins: []
					}
				  , code = req.param('code')
				  , prize_id = req.param('prize_id')
				  , selector = {}
				  , opts = {sort: {timestamp:1}, limit: ret.limit, skip: ret.offset}
				
				var send = function(){
					return Bozuko.transfer('game_prize_wins', ret, null, function(error, result){
						return res.send(error||result);
					});
				};
				
				return Bozuko.models.Contest.findOne( {
					_id: req.param('id'),
					apikey_id: req.apikey._id
				},{results: 0}, function(error, contest){
					if(error) return error.send(res);
					
					// got it...
					if( !contest ) return send();
					
					selector.contest_id = contest._id;
					if( prize_id ) selector.prize_id = prize_id;
					
					// get the prizes for this contest...
					return Bozuko.models.Prize.count(selector, function(error, count){
						ret.count = count;
						
						return Bozuko.models.Prize.find(selector, {}, opts, function(error, results){
							var items = [];
							results.forEach(function(r){
								var w = {
									name: r.user_name,
									prize_id: r.prize_id,
									code: r.code,
									win_time: r.timestamp
								};
								items.push(w);
							});
							ret.wins = items;
							return send();
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
						default_url = burl('/client/game/'+contest._id);
					}
					
					// default_url = default_url.replace(/\/api\./, '/');
					
					var redirect = default_url;
					  
					if( contest.share_url ){
						redirect = contest.share_url;
					}
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
    },
	
	'/game/:id/shared/:post_id' : {
		access: 'user',
		post : {
			handler : function(req, res){
				var post_id = req.param('post_id');
				// find game
                return Bozuko.models.Contest.find({_id:req.param('id')}, {share_url: 1, page_id: 1, game:1}, {limit:1}, function(error, contests){
                    if( error || !contests.length ) return res.send({success: false});
					var contest = contests[0];
                   
					return Bozuko.models.Share.findOne({post_id: post_id}, function(error, share){
						if( error || share ) return res.send({success: false});
						// lets save this share...
						share = new Bozuko.models.Share({
							service         :'facebook',
							type            :'share',
							contest_id      :contest._id,
							page_id         :contest.page_id,
							post_id			:post_id
						});
						share.save();
						return res.send({success: true});
					});
                });
			}
		}
	},
	
	'/themes' : {
		get : {
			access : 'developer_public',
			handler : function( req, res ){
				var limit = req.param('limit') || 25
				  , offset = req.param('offset') || 0
				  , page = req.param('page')
				  
				var where = {};
				
				if( page ) where = {
					$or : [{
						scope: {$size: 0}
					},{
						scope: {$exists: false}
					},{
						scope: page
					}]
				};
				
				return Bozuko.models.Theme.count(where, function(error,count){
					if( error ) return error.send(res);
					
					return Bozuko.models.Theme.find(where)
						.sort('order', 1)
						.limit( limit )
						.skip( offset )
						.exec(function(error, themes){
							if( error ) return error.send( res );
							return Bozuko.transfer('themes', {themes:themes, count: count, limit: limit, offset: offset}, null, function( error, result ){
								var cb;
								if( (cb = req.param('callback')) ){
									return res.send( cb+'('+JSON.stringify( error || result )+');' );
								}
								return res.send( error || result );
							});
						});
				});
			}
		}
	},
	
	'/theme' : {
		alias : '/theme/:id',
		
		get : {
			access : 'developer_public',
			handler : function( req, res ){
				var id = req.param('id') 
				  
				return Bozuko.models.Theme.findById(id, function(error,theme){
					if( error ) return error.send( res );
					return Bozuko.transfer('theme', theme, null, function( error, result ){
						var cb;
						if( (cb = req.param('callback')) ){
							return res.send( cb+'('+JSON.stringify( error || result )+');' );
						}
						return res.send( error || result );
					});
				});
			}
		},
		
		put : {
			access : 'developer_private',
			handler : function( req, res ){
				// add a new theme.
				var name = req.param('name')
				  , background = req.param('background')
				  , order = req.param('order') || 0
				  , scope = req.param('scope')
				  
				if( !name || !background){
					// these are required.
					var errors = {};
					if( !name ) errors.name = "Theme name is required";
					if( !background ) errors.background = "Theme background url is required";
					return Bozuko.transfer('theme_save_result', {
						success : false,
						errors : errors
					}, null, function(error, result){
						return res.send( error || result );
					});
				}
				
				// check for a valid url...
				var background_url;
				background_url = url.parse(background);
				
				if( !background_url.host ){
					return Bozuko.transfer('theme_save_result', {
						success : false,
						errors : {
							background: "Invalid URL"
						}
					}, null, function(error, result){
						return res.send( error || result );
					});
				}
				
				
				// TODO - check Status 200 for this and theme2x
				return checkThemeUrl( background, function(error, success){
					
					if( error || !success ) return Bozuko.transfer('theme_save_result', {
						success : false,
						errors : {
							background: "Invalid URL"
						}
					}, null, function(error, result){
						return res.send( error || result );
					});
					
					// just save it
					var theme = new Bozuko.models.Theme({
						name: name
					  , background: background
					  , order: order
					});
					
					// check for scope...
					theme.scope = scope || [];
					
					return theme.save( function(error){
						var data = error ? {
							success : false,
							error : String(error)
						} : {
							success : true,
							theme : theme
						};
						return Bozuko.transfer('theme_save_result', data, null, function(error, result){
							return res.send( error || result );
						});
					});
				});
				
			}
		},
		post : {
			access : 'developer_private',
			handler : function( req, res ){
				// add a new theme.
				var id = req.param('id')
				  , name = req.param('name')
				  , background = req.param('background')
				  , scope = req.param('scope')
				  , order = req.param('order') || 0
				  
				if( !id || !name || !background){
					// these are required.
					var errors = {};
					if( !name ) errors.name = "Theme name is required";
					if( !background ) errors.background = "Theme background url is required";
					return Bozuko.transfer('theme_save_result', {
						success : false,
						errors : errors
					}, null, function(error, result){
						return res.send( error || result );
					});
				}
				
				// check for a valid url...
				var background_url;
				try {
					background_url = url.parse(background);
				}
				catch(e){
					return Bozuko.transfer('theme_save_result', {
						success : false,
						errors : {
							background: "Invalid URL"
						}
					}, null, function(error, result){
						return res.send( error || result );
					});
				}
				
				return checkThemeUrl( background, function(error, success){
					
					if( error || !success ) return Bozuko.transfer('theme_save_result', {
						success : false,
						errors : {
							background: "Invalid URL"
						}
					}, null, function(error, result){
						return res.send( error || result );
					});
				
					// find the theme...
					return Bozuko.models.Theme.findById( id, function(error, theme){
						if( error || !theme ){
							var data = {success: false, error: "Could not find Theme"};
							return Bozuko.transfer('theme_save_result', data, null, function(error, result){
								return res.send( error || result );
							});
						}
						
						theme.name = name;
						theme.background = background;
						theme.scope = scope || [];
						theme.order = order;
						
						return theme.save( function(error){
							var data = error ? {
								success : false,
								error : String(error)
							} : {
								success : true,
								theme : theme
							};
							return Bozuko.transfer('theme_save_result', data, null, function(error, result){
								return res.send( error || result );
							});
						});
					});
				});
			}
		},
		del : {
			access : 'developer_private',
			handler : function( req, res ){
				var id = req.param('id');
				if( !id )  return Bozuko.transfer('theme_delete_result', {success: false}, null, function(error, result){
					return res.send( error || result );
				});
				
				return Bozuko.models.Theme.findById(id, function(error, theme){
					theme.remove();
					return Bozuko.transfer('theme_delete_result', {success: true}, null, function(error, result){
						return res.send( error || result );
					});
				});
			}
		}
	},
	
	'/reports/:type?' : {
		get : {
			access : 'developer_public',
			handler : function( req, res ){
				
				var type = req.param('type') || 'entries'
				  , tzOffset = parseInt(req.param('timezoneOffset', 0), 10)
				  , page_id = req.param('page_id')
				  , game_id = req.param('game_id')
                  , query = {}
				  , options ={}
                  ;

                
                if( page_id ){
                    query.page_id = new ObjectId(page_id);
                }
                if( game_id ){
                    query.contest_id = new ObjectId(game_id);
                }
				
				// hey now... lets check for the times
                options.unit = 'Day'
                options.unitInterval = 1;
                options.timezoneOffset = tzOffset;
                options.query = query;
				options.end = new Date();
				options.timeField = 'timestamp';
				
				switch(type){
					case 'unique':
						options.model = 'Entry';
                        options.distinctField = 'user_id';
						break;
					
					case 'wins':
						options.model = 'Prize';
						break;
					
					case 'game_shares':
						options.model = 'Share';
						options.query.type = 'share'; 
						break;
					
					case 'win_shares':
						options.model = 'Share';
						options.query.type = 'win'; 
						break;
					
					case 'game_share_clicks':
						options.model = 'Pageview';
						options.query.type = 'share'; 
						break;
					
					case 'win_share_clicks':
						options.model = 'Pageview';
						options.query.type = 'post'; 
						break;
					
					case 'entries':
					default:
                        options.model = "Entry";
                        break;
                }
				
				// need from and to...
				async.series([
					
					function get_pages(cb){
						if( !page_id && !game_id ){
							return Bozuko.models.Page.find({apikey_id: req.apikey._id}, {_id:1}, function(error, pages){
								if( error ) return cb(error);
								if( !pages.length ) return cb("No pages");
								var ids = [];
								pages.forEach(function(p){ ids.push(p._id);} );
								query.page_id = {$in: ids};
								return cb();
							});
						}
						return cb();
					},
					
					function get_start(cb){
						Bozuko.models[options.model].find(query)
							.sort(options.timeField, 1)
							.limit(1)
							.exec(function(error, records){
								if( error ) return cb( error );
								if( !records.length ) return cb("No records");
								options.start = records[0].get(options.timeField);
								options.start.setHours(0);
								options.start.setMinutes(0);
								options.start.setSeconds(0);
								options.start.getDate();
								
								if( tzOffset ){
									options.start.setTime( options.start.getTime() + (tzOffset||0)*1000*60 - 1000*60*60*24 );
								}
								
								return cb();
							});
					},
					
				], function run_report( error ){
					if( error ) return res.send( [] );
					
					return Report.run( 'interval', options, function(error, results){
						
						if( error ){
							console.error(require('util').inspect(error));
							return res.send([]);
						}
						// need to format the results
						var data = [];
						if( results.length ) results.forEach( function( result ){
							data.push([result.timestamp.getTime(), result.count]);
						});
						return res.send( data );
					});
				});
			}
		}
	},
	
	'/stats' : {
		get : {
			access : 'developer_public',
			handler : function( req, res ){
				
				var page_id = req.param('page_id')
				  , game_id = req.param('game_id')
				  , apikey_id = req.apikey._id
                  , query = {}
				  , options ={}
				  , stats = {}
                
                if( page_id ){
                    query.page_id = new ObjectId(page_id);
                }
                if( game_id ){
                    query.contest_id = new ObjectId(game_id);
                }
				
				// need from and to...
				async.series([
					
					function get_unique(cb){
						
						/**
						 * This would be very easy with our new stats engine:
						 *
						 * The null parameter would be for interval
						 *
						 * Stats.get('unique', null, game_id || page_id || req.apikey._id, callback )
						 *
						 */
						
						var model = Bozuko.models.Apikey
						  , id = null
						  
						if( page_id ){
							model = Bozuko.models.Page;
							id = page_id;
						}
						else if( game_id ){
							model = Bozuko.models.Contest;
							id = game_id;
						}
						else{
							id = req.apikey._id;
						}
						
						return model.findById(id, {unique_users: 1}, function(error, m){
							if( error ) return cb();
							stats.unique = m.unique_users;
							return cb();
						});
						
					},
					
					function get_entries(cb){
						
						/**
						 * This would be very easy with our new stats engine:
						 *
						 * The null parameter would be for interval
						 *
						 * Stats.get('total', null, game_id || page_id || req.apikey._id, callback )
						 *
						 */
						
						// these are going to be counts on the db
						var selector = {}
						  , get_count = function(){
								return Bozuko.models.Entry.count(selector, function(error, count){
									if( error ) return cb();
									stats.entries = count;
									return cb();
								});
							}
						
						if( game_id ) selector.contest_id = game_id;
						
						else if( page_id ) selector.page_id = page_id;
						
						else {
							// this is an apikey - we need to get the pages first
							return Bozuko.models.Page.find({apikey_id: req.apikey._id}, {_id:1}, function(error, pages){
								if( error ) return cb();
								var page_ids = [];
								pages.forEach(function(p){ page_ids.push(p._id); });
								selector.page_id = {$in: page_ids};
								return get_count();
							});
						}
						return get_count();
						
					},
					
					function get_wins(cb){
						/**
						 * This would be very easy with our new stats engine:
						 *
						 * The null parameter would be for interval
						 *
						 * Stats.get('total', null, game_id || page_id || req.apikey._id, callback )
						 *
						 */
						
						// these are going to be counts on the db
						var selector = {}
						  , get_count = function(){
								return Bozuko.models.Prize.count(selector, function(error, count){
									if( error ) return cb();
									stats.wins = count;
									return cb();
								});
							}
						
						if( game_id ) selector.contest_id = game_id;
						
						else if( page_id ) selector.page_id = page_id;
						
						else {
							// this is an apikey - we need to get the pages first
							return Bozuko.models.Page.find({apikey_id: req.apikey._id}, {_id:1}, function(error, pages){
								if( error ) return cb();
								var page_ids = [];
								pages.forEach(function(p){ page_ids.push(p._id); });
								selector.page_id = {$in: page_ids};
								return get_count();
							});
						}
						return get_count();
					}
					
				], function return_stats( error ){
					return res.send( stats );
				});
			}
		}
	}
};

function checkThemeUrl( background, callback ){
	
	if( 1 ) return callback( null, true );
	
	var standard = background
	  , img = path.basename( background )
	  , retina = path.dirname( path.dirname( background ) ) + '/theme2x/' + img
	  , good = true
	
	// check both for status 200
	return async.forEach([standard, retina], function iterator( img, cb ){
		
		var parsed_url = url.parse(img);
		
		require( parsed_url.protocol.replace(/\:/, '') ).request({
			host : parsed_url.host
		  , port : parsed_url.port || (parsed_url.protocol == 'https:' ? 443 : 80)
		  , path : parsed_url.path + (parsed_url.search||'')
		  , method : 'GET'
		}, function( res ){
			if( res.statusCode !== 200 ) good = false;
			return cb();
		});
		
	}, function all_good( error ){
		return callback( error, good )		
	});
	
}
