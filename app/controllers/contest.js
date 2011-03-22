var bozuko = require('bozuko');

var contest = {
    doc: "Bozuko Contest Object",
    def: {
        id: "Number",
        initial_odds: "String",
        start_time: "String",
        end_time: "String",
        tokens_per_play: "Number",
        entry_methods: {
            facebook_checkin: "Number", // Tokens
            faecebook_like: "Number" // Tokens
        },
        games: [{
            name: "String",
            win_config: [{
                result: "String || Object || Array depending upon game name",
                prize: "String"
            }]
        }],
        links: {
            facebook_login: "String",
            facebook_checkin: "String",
            facebook_like: "String",
            page: "String",
            contest_result: "String"
        }
    }
};

var contest_result = {
    doc: "Bozuko Contest Result",
    def:{
        win: "Boolean",
        game: "String",
        result: "String || Object || Array depending upon game name",
        prize: {
            id: "Number",
            description: "String"
        },
        links: {
            facebook_login: "String",
            facebook_checkin: "String",
            facebook_like: "String",
            prize: "String",
            prize_redemption: "String",
            page: "String",
            contest: "String"
        }
    }
};

exports.transfer_objects = {
    contest: contest,
    contest_result: contest_result
};

exports.links = {
    contest: {
        get: {
            doc: "Returns contest information",
            returns: "contest"
        }
    },

    contest_result: {
        post: {
            doc: "Retrieve a result for the given contest." +
                "The user must have tokens credited to their account in order for this to work",

            params: {
                game: {
                    required: true,
                    type: "String",
                    values: ['slots', 'scratch', 'bozuko'],
                    description: "The name of the game"
                }
            },
            returns: "contest_result"

        }
    }
};

exports.routes = {

    '/contest/:id': {

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

            handler : function(){

                bozuko.models.Contest.findById(req.params.id);

            }

        }
    }

};
