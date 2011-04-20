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

    create : function(result){
        var ret = {
            win: result.prize ? true: false,
            result: result.game_result,
            prize: result.prize
        };
        // also need to get game tokens
        return ret;
    },

    def:{
        win: "Boolean",
        result: "Mixed",
        redemption_type: "String",
        prize: "prize",
        user_tokens: "Number",
        game_state: "game_state",
        links: {
            facebook_checkin: "String",
            facebook_like: "String",
            page: "String",
            game: "String"
        }
    }
};

var game = {

    doc: "A Game Object - the game config will differ depending on the game.",

    create : function(game){
        game.config = game.contest.game_config;
        game.user_tokens = game.tokens;
        game.can_play = game.tokens > 0;
        var obj = this.merge(game, game.contest);
        obj.links = {
            contest_result: '/contest/'+game.contest._id+'/result',
            page: '/page/'+game.contest.page_id
        };
        return obj;
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
            facebook_login: "String",
            game_result: "String",
            page: "String",
            game: "String"
        }
    }
};

var game_state = {
    def: {
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
                    type: 'String',
                    description: "Latitude, Longitude"
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

    '/contest/:id': {

        /**
         * TODO -
         *
         *
         *
         */

        get: {

        }

    },

    /**
     * Play a game here. The result is pulled off the generic result list generated for the contest
     * and the index from the result is used to generate the config returned to the client.
     */
    '/contest/:id/result' : {

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
                    // lets let the contest handle finding entries, etc
                    return contest.play(req.session.user._id, function(error, result){
                        if( error ){
                            console.log('error', error);
                            return error.send(res);
                        }
                        return res.send(
                            Bozuko.transfer('game_result').create(result)
                        );
                    });
                });
            }
        }
    }
};
