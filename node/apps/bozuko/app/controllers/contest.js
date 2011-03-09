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
                            }]}],
                        links: {
                            page: '/page/4040432'
                        }
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
                    },
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

                returns: {
                    name: "checkin_result",
                    type: "Object",
                    description: "Return an object containg the number of tokens earned",

                    example: {
                        id: 4553453,
                        tokens: 3
                    }
                }
            },

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
                        console.log(error);
                        res.send({
                            id: page_id,
                            tokens: 3
                        });
                        res.end();
                    });
                });
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
