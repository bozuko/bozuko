var S3 = Bozuko.require('util/s3');
var url = require('url');

var game_prize = {
    doc: "A prize that can be won in a game",
    def: {
        name: "String",
        description: "String",
        result_image: "String"
    }
};

var game_result = {
    doc: "Bozuko Game Result",

    create : function(result, user, callback){
        
        var self = this;
        var ret = {
            win: result.play.win,
            result: result.game_result,
            prize: result.prize,
            free_play: result.free_play,
            consolation: result.play.consolation
        };

        if( ret.consolation ){
            ret.message = "You lost, bummer!\nBut, because we are such good sports, we are going to give you a prize just for playing!";
        }
        
        

        return Bozuko.transfer('game_state', result.contest.game_state, user, function( error, game_state){
            if( error ) return callback( error );
            ret.game_state = game_state;
            if( result.prize ) return Bozuko.transfer('prize', result.prize, user, function(error, prize){
                if( error ) return callback( error );
                ret.prize = prize;
                ret.links = {
                    page: '/page/'+result.contest.page_id,
                    game: '/game/'+result.contest.id
                };
                return callback( null, ret);
            });
            ret.links = {
                page: '/page/'+result.contest.page_id,
                game: '/game/'+result.contest.id
            };
            return callback( null, ret);
        });
    },

    def:{
        win: "Boolean",
        result: "Mixed",
        free_play: "Boolean",
        consolation: "Boolean",
        message: "String",
        prize: "prize",
        game_state: "game_state",
        links: {
            page: "String",
            game: "String"
        }
    }
};

var game = {

    doc: "A Game Object - the game config will differ depending on the game.",

    create : function(game, user, callback){
        // load the prizes up...
        var obj = {};
        obj = this.merge(obj, game.contest);
        obj = this.merge(obj, game);
        obj.rules = game.contest.getOfficialRules();
        obj.id = game.contest.id;
        obj.type = game.getType();
        obj.name = game.getName();
        obj.config = game.getConfig();
        obj.prizes = game.getPrizes();
        obj.image = game.getListImage();
        obj.list_message = game.contest.getListMessage();
        obj.entry_method.description = game.contest.getEntryMethodDescription();
        // obj.can_play = obj.game_state.user_tokens > 0;
        obj.links = {
            page: '/page/'+game.contest.page_id,
            game: '/game/'+game.contest.id
        };
        return this.sanitize(obj, null, user, callback);
    },

    def:{
        id: "String",
        type: "String",
        name: "String",
        image: "String",
        description: "String",
        list_message: "String",
        config: "Object",
        start_time: "String",
        end_time: "String",
        entry_method:'entry_method',
        game_state: 'game_state',
        prizes:['game_prize'],
        consolation_prizes:['game_prize'],
        rules: "String",
        links: {
            login: "String",
            page: "String",
            game: "String"
        }
    }
};

var game_state = {

    create : function(game_state, user, callback){
        if( game_state.contest){
            game_state.game_id = game_state.contest.id;
            var links = {
                game_state: '/game/'+game_state.contest.id+'/state',
                game: '/game/'+game_state.contest.id
            };
            if( game_state.user_tokens > 0 ){
                game_state.button_action = 'play';
                links.game_result = '/game/'+game_state.contest.id+'/result';
            }
            if( game_state.button_enabled && game_state.button_action =='enter'){
                links.game_entry = '/game/'+game_state.contest.id+'/entry';
            }
            game_state.links = links;
        }
        return this.sanitize(game_state, null, user, callback);
    },

    def: {
        game_id: "String",
        user_tokens: "Number",
        next_enter_time: "String",
        button_text: "String",
        button_enabled: "Boolean",
        button_action: "String",
        game_over: "Boolean",
        links: {
            game_result: "String",
            game_entry: "String",
            game_state: "String",
            game: "String"
        }
    }
};

var entry_method = {

    doc: "An entry method ",

    def: {
        type: "String",
        image: "String",
        description: "String"
    }
};


exports.transfer_objects = {
    game: game,
    game_state: game_state,
    game_result: game_result,
    entry_method: entry_method,
    game_prize: game_prize
};

exports.session = false;

exports.links = {
    game: {
        get: {
            doc: "Returns game information",
            returns: "game"
        }
    },

    game_result: {
        post: {
            access: 'mobile',

            doc: "Retrieve a result for the given game." +
                "The user must have tokens credited to their account in order for this to work",

            params: {
                ll: {
                    required: true,
                    type: 'String',
                    description: "Latitude and Longitude in the form of lat,lng"
                }
            },
            returns: "game_result"

        }
    },

    game_entry: {
        post: {
            access: 'mobile',
            params: {
                ll: {
                    required: true,
                    type: 'String',
                    description: "Latitude and Longitude in the form of lat,lng"
                }
            },
            returns: ['game_state']
        }
    },

    game_state: {
        get : {
            access: 'user',
            params: {
                ll: {
                    required: true,
                    type: 'String',
                    description: "Latitude and Longitude in the form of lat,lng"
                }
            },
            returns: 'game_state'
        }
    }
};

exports.routes = {

    '/game/:id': {

        get: {
            handler: function(req,res){
                Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    // lets let the contest handle finding entries, etc
                    return contest.loadTransferObject( req.session.user, function(error){
                        if( error ) return error.send(res);
                        var game = contest.getGame();
                        return Bozuko.transfer('game', game, req.session.user, function(error, result){
                            return res.send( error || result );                            
                        });
                    });
                });
            }
        }

    },

    '/game/:id/prize/:prize_index/barcode/:barcode_index': {
        get: {
//            access: 'mobile',

            handler: function(req, res) {
                var s3 = new S3();
                return s3.get(url.parse(req.url).pathname, res);
            }
        }

    },

    '/game/:id/consolation_prize/:prize_index/barcode/:barcode_index': {
        get: {
  //          access: 'mobile',

            handler: function(req, res) {
                var s3 = new S3();
                return s3.get(url.parse(req.url).pathname, res);
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
                Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    if( contest.state !== contest.schema.ACTIVE ){
                        return Bozuko.error('contest/inactive').send(res);
                    }
                    return contest.play(req.session.user._id, function(error, result){
                        if( error ){
                            return error.send(res);
                        }

                        return result.contest.loadTransferObject( req.session.user, function(error){
                            if( error ) return error.send(res);
                            if( result.prize ){
                                return result.prize.loadTransferObject(function(error, prize){
                                    if( error ) return error.send(res);
                                    result.prize = prize;
                                    return Bozuko.transfer('game_result', result, req.session.user, function(error, result){
                                        return res.send( error || result );
                                    });
                                });
                            }

                            return Bozuko.transfer('game_result', result, req.session.user, function(error, result){
                                return res.send( error || result );
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
                var send = res.send;
                res.send = function(){
                    send.apply(res, arguments);
                };
                return Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    if( contest.state !== contest.schema.ACTIVE ){
                        return Bozuko.error('contest/inactive').send(res);
                    }
                    
                    /*
                    if( !req.session.location ){
                        return Bozuko.error('contest/game_entry_requires_ll', req.params.id).send(res);
                    }
                    */
                    // we need to process the entry
                    var ll = req.param('ll');
                    if( !ll ){
                        return Bozuko.error('contest/game_entry_requires_ll', req.params.id).send(res);
                    }
                    var parts = ll.split(',');
                    if( parts.length != 2 ){
                        return Bozuko.error('contest/game_entry_requires_ll', req.params.id).send(res);
                    }
                    
                    parts.reverse();
                    parts[0] = parseFloat( parts[0] );
                    parts[1] = parseFloat( parts[1] );
                    
                    
                    var config = contest.entry_config[0];
                    var entry = Bozuko.entry( config.type, req.session.user, {ll: parts} );
                    return contest.enter( entry, function(error, entry){
                        if( error ) return error.send(res);

                        if( !entry ){
                            return Bozuko.error('contest/entry_not_found').send(res);
                        }

                        // cool it went through, lets get all games and states in case this handled multiple
                        return Bozuko.models.Page.findById(contest.page_id, function(error, page){
                            if( error ) return error.send(res);
                            if( !page ) return Bozuko.error('contest/page_not_found').send(res);
                            return page.getUserGames( req.session.user, function(error, games){
                                if( error ) return error.send(res);
                                // get the game states
                                var states = [];
                                games.forEach( function(game){
                                    states.push(game.contest.game_state);
                                });
                                return Bozuko.transfer('game_state', states, req.session.user, function(error, result){
                                    res.send( error || result );
                                });
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
                return Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    var user = req.session.user;
                    return contest.loadGameState(user, function(error){
                        return Bozuko.transfer('game_state', contest.game_state, user, function(error, result){
                            res.send( error || result );
                        });
                    });
                });
            }
        }
    }
};
