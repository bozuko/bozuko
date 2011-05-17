var game_prize = {
    doc: "A prize that can be won in a game",
    def: {
        name: "String",
        description: "String",
        total: "Number",
        available:"Number",
        result_icon: "String"
    }
};

var game_result = {
    doc: "Bozuko Game Result",

    create : function(result, user){
        var ret = {
            win: result.prize ? true: false,
            result: result.game_result,
            prize: result.prize,
            free_play: result.free_play,
            consolation: result.play.consolation
        };

        ret.game_state = Bozuko.transfer('game_state', result.contest.game_state, user);
        if( result.prize ){
            ret.prize = Bozuko.transfer('prize', result.prize, user);
        }
        ret.links = {
            page: '/page/'+result.contest.page_id,
            game: '/game/'+result.contest.id
        };
        return ret;
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

    create : function(game, user){
        game.config = game.contest.game_config;
        var obj = this.merge(game, game.contest);
        obj.image = game.icon;
        obj.list_message = game.contest.getListMessage();
        obj.entry_method.description = game.contest.getEntryMethodDescription();
        // obj.can_play = obj.game_state.user_tokens > 0;
        obj.links = {
            page: '/page/'+game.contest.page_id,
            game: '/game/'+game.contest.id
        };
        return this.sanitize(obj, null, user);
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
        rules: "String",
        links: {
            login: "String",
            page: "String",
            game: "String"
        }
    }
};

var game_state = {

    create : function(game_state, user){
        if( game_state.contest){
            game_state.game_id = game_state.contest.id;
            var links = {
                game_state: '/game/'+game_state.contest.id+'/state'
            };
            if( game_state.user_tokens > 0 ){
                links.game_result = '/game/'+game_state.contest.id+'/result';
            }
            if( game_state.button_action =='enter'){
                links.game_entry = '/game/'+game_state.contest.id+'/entry';
            }
            game_state.links = links;
        }
        return this.sanitize(game_state);
    },

    def: {
        game_id: "String",
        user_tokens: "Number",
        next_enter_time: "String",
        button_text: "String",
        button_enabled: "Boolean",
        button_action: "String",
        links: {
            game_result: "String",
            game_entry: "String",
            game_state: "String"
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
                        return res.send(
                            Bozuko.transfer('game', game, req.session.user)
                        );
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
                Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    return contest.play(req.session.user._id, function(error, result){
                        if( error ){
                            return error.send(res);
                        }

                        console.log('play');

                        return result.contest.loadTransferObject( req.session.user, function(error){
                            if( error ) return error.send(res);
                            if( result.prize ){
                                return result.prize.loadTransferObject(function(error, prize){
                                    if( error ) return error.send(res);
                                    result.prize = prize;
                                    return res.send(
                                        Bozuko.transfer('game_result', result, req.session.user)
                                    );
                                });
                            }
                            return res.send(
                                Bozuko.transfer('game_result', result, req.session.user)
                            );
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
                return Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
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
                    parts.reverse();
                    parts[0] = parseFloat( parts[0] );
                    parts[1] = parseFloat( parts[1] );
                    /**
                     * TODO - create and process and entry
                     */
                    var config = contest.entry_config[0];
                    var entry = Bozuko.entry( config.type, req.session.user, {ll:parts} );
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
                                return res.send( Bozuko.transfer('game_state', states, req.session.user) );
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
                    // lets let the contest handle finding entries, etc
                    return contest.loadGameState(req.session.user, function(error){
                        res.send( Bozuko.transfer('game_state', contest.game_state, req.session.user) );
                    });
                });
            }
        }
    }
};
