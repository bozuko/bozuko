var game_prize = {
    doc: "A prize that can be won in a game",
    def: {
        name: "String",
        description: "String",
        result_image: "String"
    }
};


var entry_method = {
    doc: "An entry method ",
    def: {
        type: "String",
        image: "String",
        small_image: "String",
        description: "String"
    }
};


var game_result = {
    doc: "Bozuko Game Result",
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
    },

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

        var page_id = result.contest.game_state.page_id;
        return Bozuko.transfer('game_state', result.contest.game_state, user, function( error, game_state){
            if( error ) return callback( error );
            ret.game_state = game_state;
            if( result.prize ) return Bozuko.transfer('prize', result.prize, user, function(error, prize){
                if( error ) return callback( error );
                ret.prize = prize;
                ret.links = {
                    page: '/page/'+result.contest.game_state.page_id,
                    game: '/game/'+result.contest.id
                };
                return callback( null, ret);
            });
            ret.links = {
                page: '/page/'+page_id,
                game: '/game/'+result.contest.id
            };
            return callback( null, ret);
        });

    }
};

var game = {
    doc: "A Game Object - the game config will differ depending on the game.",
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
    },

    create : function(game, user, callback){

        // load the prizes up...
        var self = this,
            obj = {};
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
        return game.contest.getEntryMethodDescription(user, game.contest.game_state.page_id, function(error, description){
            if (error) return callback(error);
            obj.entry_method.description = description;
            obj.entry_method.image = game.contest.getEntryMethod(user).image;
            // obj.can_play = obj.game_state.user_tokens > 0;
            obj.links = {
                page: '/page/'+game.contest.game_state.page_id,
                game: '/game/'+game.contest.id
            };
            return self.sanitize(obj, null, user, callback);
        });
    }
};

var game_state = {
    def: {
        game_id: "String",
        user_tokens: "Number",
        next_enter_time: "String",
        next_enter_time_ms: "Number",
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
    },

    create : function(game_state, user, callback){
        var self = this;
        if( game_state.contest){
            game_state.game_id = game_state.contest.id;
            var links = {
            };
            if (game_state.page_id) {
                links.game_state = '/game/'+game_state.contest.id+'-'+game_state.page_id+'/state';
                links.game = '/game/'+game_state.contest.id+'-'+game_state.page_id;
            } else {
                links.game_state = '/game/'+game_state.contest.id+'/state';
                links.game = '/game/'+game_state.contest.id;
            }

            if( game_state.user_tokens > 0 ){
                game_state.button_action = 'play';
                if (game_state.page_id) {
                    links.game_result = '/game/'+game_state.contest.id+'-'+game_state.page_id+'/result';
                } else {
                    links.game_result = '/game/'+game_state.contest.id+'/result';
                }
            }
            if( game_state.button_enabled && game_state.button_action =='enter'){
                if (game_state.page_id) {
                    links.game_entry = '/game/'+game_state.contest.id+'-'+game_state.page_id+'/entry';
                } else {
                    links.game_entry = '/game/'+game_state.contest.id+'/entry';
                }
            }
            game_state.next_enter_time_ms = Math.max(+game_state.next_enter_time - Date.now(),0);
            game_state.links = links;
        }
        return self.sanitize( game_state, null, user, callback );
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
