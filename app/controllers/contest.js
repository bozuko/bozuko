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
        game: "String",
        user_tokens: "Number",
        game_update: "game_update",
        links: {
            facebook_checkin: "String",
            facebook_like: "String",
            page: "String"
        }
    }
};

var game = {

    doc: "A Game Object",

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
        type: "String",
        name: "String",
        icon: "String",
        description: "String",
        list_message: "String",
        user_tokens: "Number",
        token_message: "String",
        config: "Object",
        can_play: "Boolean",
        start_time: "String",
        end_time: "String",
        entry_methods:'entry_method',
        prizes:['game_prize'],
        rules: "String",
        links: {
            facebook_login: "String",
            game_result: "String",
            page: "String"
        }
    }
};

var game_update = {
    def: {
        user_tokens: "Number",
        can_play: "Boolean",
        next_play_time: "String",
        button_text: "String",
        button_enabled: "Boolean",
        links: {
            
        }
    }
};

var entry_method = {

    doc: "An entry method ",

    def: {
        available: "Boolean",
        type: "String",
        tokens: "Number",
        button_text: "String",
        icon: "String",
        description: "String",
        links:{
            entry_method: "String"
        }
    }
};


exports.transfer_objects = {
    game: game,
    game_update: game_update,
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
            access: 'user',
            doc: "Retrieve a result for the given game." +
                "The user must have tokens credited to their account in order for this to work",
            returns: "game_result"

        }
    },
    
    entry_method: {
        post: {
            access: 'user',
            returns:  "entry_method"
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

        access : 'user',

        post: {

            handler : function(req,res){
                Bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return Bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    // lets let the contest handle finding entries, etc
                    return contest.play(req.session.user, function(error, result){
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
