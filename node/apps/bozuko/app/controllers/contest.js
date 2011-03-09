var bozuko = require('bozuko');

exports.routes = {

    '/contest/:id': {

        get: {
            doc: {
                description: "Get information about a contest",

                params: {
                    id: {
                        type: "Number",
                        description: "The id of the contest"
                    }
                },

                returns: {
                    name: "contest_info",
                    type: "Object",
                    description: "Contest Information",

                    example: {
                        id: 4553453,
                        initial_odds: "1:5",
                        start_time: new Date().toString(),
                        end_time: new Date(2012, 'july', 4).toString(),
                        tokens_per_play: 1,
                        // Maybe use URLs in the entry_config instead
                        entry_config: {
                            facebook : {
                                checkin: 3,
                                like: 1
                            }
                        },
                        games: [{
                            name: 'slots',
                            win_config: [{
                                result: ['gun', 'gun', 'gun'],
                                prize: 'buffalo wings'
                            },{
                            result: ['seven', 'seven', 'seven'],
                            prize: 'free entree'
                            }]}, {
                            name: 'scratch ticket',
                            win_config: [{
                                result: [0, 7, 12, 9, 4, 13, 5, 2, 1, 3, 4],
                                prize: 'free appetizer'
                            }]}]
                    }
                }
            }
        }
    },

    '/contest/:id/entry/facebook/checkin': {

        post: {
            doc: {
                description: "Enter a contest and receive tokens via a facebook checkin",

                params: {
                    id: {
                        type: "Number",
                        description: "The id of the contest"
                    }
                },

                returns: {
                    name: "checkin_result",
                    type: "Object",
                    description: "Return an object containg the number of tokens earned",

                    example: {
                        id: 4553453,
                        tokens: 3
                    }
                }
            }
        }
    },

    '/contest/:id/entry/facebook/like': {

        post: {
            doc: {
                description: "Enter a contest and receive tokens via a facebook like",

                params: {
                    id: {
                        type: "Number",
                        description: "The id of the contest"
                    }
                },

                returns: {
                    name: "like_result",
                    type: "Object",
                    description: "Return an object containg the number of tokens earned",

                    example: {
                        id: 4553453,
                        tokens: 3
                    }
                }
            }
        }
    }
};
