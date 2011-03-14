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

var facebook_checkin_result = {
    doc: "Result from a Facebook Checkin",
    def:{
        id: "Number",
        tokens: "Number",
        timestamp: "Date",
        duration: "Number",
        links: {
            facebook_like: "String",
            contest_result: "String"
        }
    }
};

var facebook_like_result = {
    doc: "Result of a Facebook Like",
    def:{
        id: "Number",
        tokens: "Number",
        timestamp: "Date",
        duration: "Number",
        links: {
            contest_result: "String"
        }
    }
};

exports.transfer_objects = {
    contest: contest,
    contest_result: contest_result,
    facebook_checkin_result: facebook_checkin_result,
    facebook_like_result: facebook_like_result
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
    },

    facebook_checkin: {
        post: {
            doc: "Checkin to facebook and receive tokens",
            params: {
                lat: {
                    required: true,
                    type: "Number",
                    description: "User latitude"
                },
                lng: {
                    required: true,
                    type: "Number",
                    description: "User longitude"
                },
                message : {
                    type: "String",
                    description: "The user message to post with the checkin."
                }
            },
            returns: "facebook_checkin_result"
        },

        get: {
            doc: "Retrieve information about the last facebook checkin for the user",
            returns: "facebook_checkin_result"
        }
    },

    facebook_like: {
        post: {
            doc: "Like a facebook page and receive tokens",
            params: {
                lat: {
                    type: "Number",
                    description: "Latitude"
                },
                lng : {
                    type: "Number",
                    description: "Longitude"
                }
            },
            returns: "facebook_like_result"
        },

        get: {
            doc: "Retrieve information about the last facebook like for the user.",
            returns: "facebook_checkin_result"
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
        post: {
        }
    },

    '/contest/:id/entry/facebook/checkin': {

        post: {

            handler: function(req, res) {
                var page_id = req.param('page_id');
                var lat = req.param('lat');
                var lng = req.param('lng');

                // we should have the user from the session...
                if( !req.session.user ){
                    res.statusCode = 404,
                    res.end();
                    return;
                }
                // lets check them in...
                bozuko.service('facebook').place({place_id: page_id}, function(error, p){
                    bozuko.service('facebook').checkin({
                        user        :req.session.user,
                        message     :'Just won a free burrito playing bozuko!',
                        place_id    :p.id,
                        actions     :{name:'View on Bozuko', link:'http://bozuko.com'},
                        link        :'http://bozuko.com',
                        picture     :'http://bozuko.com/images/bozuko-chest-check.png',
                        description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
                        latLng      :{lat:p.location.latitude,lng:p.location.longitude}
                    },function(error, result){
                        // TODO: set the status code based on error
                        if (error) {
                            res.statusCode = 400;
                            res.send(error);
                        } else {
                            result.tokens = 3;
                            res.send(result);
                        }
                    });
                });
            }
        }
    },

    '/contest/:id/entry/facebook/like': {

        post: {
            /**
             * Pseudo code for entering a contest
             */
            pseudo : function(){
                bozuko.models.Contest.findById(req.params.id, function(err, contest){

                    // do we have a contest?
                    if( !contest ){
                        res.send({
                            error: "Invalid Contest"
                        });
                    }

                    var entryMethod = Entry.factory('facebook/like');

                    var result = contest.enter(req.session.user, entryMethod);
                    res.send(result);

                });
            }
        }
    }
};
