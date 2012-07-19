var burl = Bozuko.require('util/url').create
  , merge = Bozuko.require('util/object').merge
  ;

var game_prize = {
    doc: "A prize that can be won in a game",
    def: {
        id: 'String',
        quantity:'Number',
        value:'Number',
        expiration:'Number',
        hide_expiration:'Boolean',
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
        use_location: "Boolean",
        small_image: "String",
        description: "String"
    },
    
    create : function(entry, user, callback){
        entry.use_location = false;
        if( ~['facebook/checkin','bozuko/checkin','facebook/likecheckin'].indexOf( entry.type ) ) entry.use_location = true;
        else if ( entry.config.options && entry.config.options.radius ) entry.use_location = true;
        return this.sanitize(entry, null, user, callback);
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
            /**
             * TODO
             * 
             * This is a temporary workaround for consolation prizes. We probably want to handle
             * this futher back in the stack, but this is fine for now.
             */
            // ret.message = "You lost, bummer!\nBut, because we are such good sports, we are going to give you a prize just for playing!";
            ret.win = true;
            ret.consolation = true;
        }

        var page_id = result.contest.game_state.page_id;
        return Bozuko.transfer('game_state', result.contest.game_state, user, function( error, game_state){
            if( error ) return callback( error );
            ret.game_state = game_state;
            if( result.prize ) {
                return Bozuko.transfer('prize', result.prize, user, function(error, prize){
                    if( error ) return callback( error );
                    ret.prize = prize;
                    ret.links = {
                        page: '/page/'+result.contest.game_state.page_id,
                        game: '/game/'+result.contest.id
                    };
                    return callback( null, ret);
                });
            }
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
        url: "String",
        type: "String",
        name: "String",
        start: "String",
        end: "String",
        ingame_copy: 'String',
        post_to_wall: 'Boolean',
        share_url : 'String',
        share_title: 'String',
        share_description: 'String',
        theme:'String',
        entry_duration:'Number',
        entry_type:'String',
        entry_plays:'Number',
        consolation_when:'String',
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
        hide_consolations: 'Boolean',
        rules: "String",
        // developer fields
        links: {
            login: "String",
            page: "String",
            game: "String"
        }
    },

    create : function(game, user, callback){
        var apikey=false;
        if( user instanceof Bozuko.models.Apikey ){
            apikey = user;
            user = false;
        }
        // load the prizes up...
        var self = this,
            obj = {};
            
        obj = this.merge(obj, game.contest);
        obj = this.merge(obj, game);
        obj.url = burl('/'+game.contest.page_id+'/'+game.contest._id);
        obj.rules = game.contest.getOfficialRules();
        obj.id = game.contest.id;
        if( game.contest.web_only ){
            obj.share_url = burl('/game/'+game.contest.id+'/share');
            obj.share_title = game.contest.share_title || 'Play '+game.getName()+'!';
            obj.share_description = game.contest.share_description || 'Play '+game.getName()+' for a chance to win big prizes!';
        }
        else {
            obj.share_url = burl('/game/'+game.contest.id+'/share');
            obj.share_title = game.contest.share_title || 'Play '+game.getName()+'!';
            obj.share_description = game.contest.share_description || 'Play '+game.getName()+' on your phone for a chance to win big prizes!';
        }
        obj.type = game.getType();
        obj.name = game.getName();
        obj.config = game.getConfig();
        obj.prizes = game.getPrizes();
        obj.image = game.getListImage();
        obj.list_message = game.contest.getListMessage();
        
        if(apikey){
            
            var ec = game.contest.getEntryConfig();
            obj.entry_duration = ec.duration;
            obj.entry_type = ec.type;
            obj.entry_plays = ec.tokens;
            if(game.contest.consolation_config)
                obj.consolation_when = game.contest.consolation_config.when
        }
        
        var page_id = game.contest.game_state ? game.contest.game_state.page_id : game.contest.page_id;
        return game.contest.getEntryMethodDescription(user, page_id, function(error, description){
            if (error) return callback(error);
            obj.entry_method.description = description;
            obj.entry_method.image = game.contest.getEntryMethod(user).image;
            // obj.can_play = obj.game_state.user_tokens > 0;
            obj.links = {
                page: '/page/'+page_id,
                game: '/game/'+game.contest.id
            };
            return self.sanitize(obj, null, user, callback);
        });
    }
};

var game_save_result = {
    doc: "Result of saving a game via PUT or POST",
    def: {
        success: "Boolean",
        errors: "Object",
        error: "String",
        game: "game"
    }
};

var game_publish_result = {
    doc: "Result of publishing a game",
    def: {
        success: "Boolean",
        error: "String",
        game: "game"
    }
};

var game_cancel_result = {
    doc: "Result of cancelling a game",
    def: {
        success: "Boolean",
        error: "String",
        game: "game"
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
            if (game_state.button_text === 'Thanks For Playing' || game_state.button_text === 'Game Over') {
                game_state.next_enter_time_ms = 60000000; // some large number
            }
            game_state.links = links;
        }
        return self.sanitize( game_state, null, user, callback );
    }
};

exports.transfer_objects = {
    game: game,
    game_save_result: game_save_result,
    game_publish_result: game_publish_result,
    game_cancel_result: game_cancel_result,
    game_state: game_state,
    game_result: game_result,
    entry_method: entry_method,
    game_prize: game_prize
};

var game_params = {
    type : {
        type: "String",
        description: "Game Type (only 'scratch' right now)"
    },
    start : {
        type : "Date",
        description : "The start time of the game - UTCString"
    },
    end : {
        type : "Date",
        description : "The end time of the game - UTCString"
    },
    theme : {
        type : "String",
        description : "The theme name (or URL of a theme bg)"
    },
    entry_duration : {
        type: "Number",
        description: "How often a user can enter (ms)"
    },
    entry_type : {
        type: "String",
        description: "The method of entry (must be one of the following: like, likecheckin, checkin, nothing)"
    },
    entry_plays : {
        type: "Number",
        description: "Number of plays a user receives per entry"
    },
    rules : {
        type: "String",
        description: "If this is left blank, the default rules will be used."
    },
    name : {
        type: "String",
        description: "The name of the Game / Scratch Ticket (defaults to 'Match 3')."
    },
    share_url : {
        type: "String",
        description: "The URL for the facebook share - defaults to the link for the game."
    },
    share_title : {
        type: "String",
        description: "The title in the Facebook Share"
    },
    share_description : {
        type: "String",
        description: "The description of the Facebook Share"
    },
    prizes : {
        type: "Array",
        description: [
            "An array of the possible prizes.<br />",
            "Each prize is an object with the following properties:",
            "<ul>",
                "<li><strong>name</strong> String</li>",
                "<li><strong>description</strong> String</li>",
                "<li><strong>value</strong> Number</li>",
                "<li><strong>quantity</strong> Number</li>",
                "<li><strong>hide_expiration</strong> Boolean</li>",
                "<li><strong>expiration</strong> Number - Number of ms prize is active after winning.</li>",
            "</ul>"
        ].join('\n')
    },
    consolation_prizes : {
        type: "Array",
        description: [
            "An array of the possible prizes. IMPORTANT! Only one consolation prize is supported right now.<br />",
            "Each prize is an object with the following properties:",
            "<ul>",
                "<li><strong>name</strong> String</li>",
                "<li><strong>description</strong> String</li>",
                "<li><strong>value</strong> Number</li>",
                "<li><strong>quantity</strong> Number</li>",
                "<li><strong>hide_expiration</strong> Boolean</li>",
                "<li><strong>expiration</strong> Number - Number of ms prize is active after winning.</li>",
            "</ul>"
        ].join('\n')
    },
    consolation_when : {
        type: "String",
        description : "Either 'once' or 'always'"
    },
    hide_consolations : {
        type: "Boolean",
        description : "Do not display consolation prizes on the prize list in the game description"
    },
    ingame_copy : {
        type: "String",
        description : "HTML copy to display on the game, below the prize list."
    }
};

exports.links = {
    game: {
        get: {
            doc: "Returns game information",
            returns: "game"
        },
        
        put: {
            access: 'developer_private',
            returns: 'game_save_result',
            params : merge({
                page_id : {
                    type : "String",
                    description : "The page ID",
                    required : true
                }
            }, game_params)
        },
        post: {
            access: 'developer_private',
            returns: 'game_save_result',
            params: game_params
        }
    },
    
    game_publish : {
        post: {
            access: 'developer_private',
            returns: 'game_publish_result'
        }
    },
    
    game_cancel : {
        post: {
            access: 'developer_private',
            returns: 'game_cancel_result'
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
