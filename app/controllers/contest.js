var bozuko = require('bozuko');

var game_prize = {
    doc: "A prize that can be won in a game",
    def: {
        name: "String",
        description: "String",
        total: "Number",
        available:"Number"
    }
};

var game_result = {
    doc: "Bozuko Game Result",
    def:{
        win: "Boolean",
        result: "Mixed",
        redemption_type: "String",
        prize: "prize",
        links: {
            facebook_login: "String",
            facebook_checkin: "String",
            facebook_like: "String",
            prize: "prize",
            page: "String",
            game: "String"
        }
    }
};

var game = {
        
    doc: "A Game Object",
    
    def:{
        type: "String",
        name: "String",
        icon: "String",
        description: "String",
        user_tokens: "Number",
        token_message: "String",
        config: "Object",
        can_play: "Boolean",
        start_time: "String",
        end_time: "String",
        tokens_per_play: "Number",
        entry_methods:['entry'],
        prizes:['prize'],
        rules: "String",
        links: {
            facebook_login: "String",
            page: "String"
        }
    }
};

var entry_method = {
    
    doc: "An entry method ",
    
    def: {
        available: "Boolean",
        reason: "String",
        type: "String",
        tokens: "Number",
        icon: "String",
        description: "String",
        link: "String"
    }
};


exports.transfer_objects = {
    game: game,
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
            doc: "Retrieve a result for the given game." +
                "The user must have tokens credited to their account in order for this to work",
            returns: "game_result"

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
                bozuko.models.Contest.findById(req.params.id, function(error, contest){
                    if( error ){
                        return error.send(res);
                    }
                    if( !contest ){
                        return bozuko.error('contest/unknown', req.params.id).send(res);
                    }
                    // lets let the contest handle finding entries, etc
                    return contest.play(req.session.user, function(error, result){
                        if( error ) return error.send(res);
                        return res.send( bozuko.transfer('contest_result', result) );
                    });
                });
            }
        }
    }

};
