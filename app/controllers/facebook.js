var bozuko = require('bozuko');

var facebook_checkin_result = {
    doc: "Result from a Facebook Checkin",
    def:{
        id: "Number",
        tokens: "Number",
        timestamp: "String",
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
    facebook_checkin_result: facebook_checkin_result,
    facebook_like_result: facebook_like_result
};

exports.links = {
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

var checkin = function(res, user_id, fb_id, lat, lng, msg) {
    bozuko.service('facebook').checkin({
        test: true,
        user: user_id,
        message: msg,
        place_id: fb_id,
        link        :'http://bozuko.com',
        picture     :'http://bozuko.com/images/bozuko-chest-check.png',
        description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
        latLng: {
            lat: lat,
            lng:lng
        }},
        function(error, result){
            if (error) {
                res.statusCode = 500;
                res.end();
                return;
            }
            // TODO: send a real facebook_checkin_result and save this in the db
            res.send({
                links: {
                    facebook_like: '/facebook/'+fb_id+"/like"
                }
            });
        }
    );
};

exports.routes = {

    '/facebook/:id/checkin': {
        post: {
            access: 'user',

            handler: function(req, res) {

                var id = req.param('id');
                var lat = req.param('lat');
                var lng = req.param('lng');
                var msg = req.param('message') || '';

                if( !lat || !lng ){
                    res.send({
                        name: "missing parameters",
                        msg: "No Latitude / Longitude"
                    }, 400);
                    return;
                }

                bozuko.models.Page.findOne({'services.name': 'facebook', 'services.id': id}, function(err, page) {
                    if (page) {
                        bozuko.models.Contest.findById(req.params.id, function(err, contest){

                            if( !contest ){
                                checkin(res, req.session.user._id, id, lat, lng, msg);
                                return;
                            }

                            contest.enter(
                                bozuko.entry('facebook/checkin', req.session.user, {
                                    latLng: {lat:lat, lng:lng},
                                    message: msg
                                }),
                                function(error, entry){
                                    if( error ){
                                        res.send(bozuko.sanitize('error',error));
                                        return;
                                    }
                                    var fb_checkin_res = {
                                        id: entry._id,
                                        timestamp: entry.timestamp,
                                        tokens: entry.tokens,
                                        links: {
                                            facebook_like: "/facebook/"+id+"/like"
                                        }
                                    };
                                    var ret = bozuko.sanitize('facebook_checkin_result', fb_checkin_res);
                                    res.send(ret);
                                }
                            );
                        });
                    } else {
                        checkin(res, req.session.user._id, id, lat, lng, msg);
                    }
                });
            }
        }
    },

    '/facebook/:id/like': {

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

                    var entryMethod = Entry.create('facebook/like');

                    var result = contest.enter(req.session.user, entryMethod);
                    res.send(bozuko.transfer('facebook_checkin_result', result));

                });
            }
        }
    }

};
