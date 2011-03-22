var bozuko = require('bozuko');

var facebook_result = {
    doc: "Result from a Facebook Operation",
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


exports.transfer_objects = {
    facebook_result: facebook_result
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
            returns: "facebook_result"
        },

        get: {
            doc: "Retrieve information about the last facebook like for the user.",
            returns: "facebook_result"
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
                return error.send(res);
            }
            // TODO: send a real facebook_result
            res.send({
                links: {
                    facebook_like: '/facebook/'+fb_id+"/like"
                }
            });
        }
    );
};

var like = function(req, res) {
    bozuko.service('facebook').like({
        test: true,
        user: req.session.user._id,
        link        :'http://bozuko.com',
        picture     :'http://bozuko.com/images/bozuko-chest-check.png',
        description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
        object_id   : req.param('id')
    },
    function(err, result) {
        if (err) {
            return err.send(res);
        }
        // TODO: send a real result
        res.send({
            links: {
            }
        });
    });
};

var run = function(req, res, op, params, callback) {
    var id = req.session.user._id;
    bozuko.models.Page.findOne(
        {'services.name': 'facebook', 'services.id': id},
        function(err, page) {
            if (err) {
                return bozuko.error('facebook/db_error').send(res);
            }
            if (page) {
                page.getContests(function(contests) {
                    if (contests.length === 0) {
                        return callback();
                    }
                    contests.foreach(function(contest) {
                        contest.enter(
                            bozuko.entry('facebook/'+op, req.session.user, params),
                            function(error, entry){
                                if( error ){
                                    return error.send(res);
                                }
                                var fb_res = {
                                    id: entry._id,
                                    timestamp: entry.timestamp,
                                    tokens: entry.tokens,
                                    links: {
                                        facebook_like: "/facebook/"+id+"/"+op
                                    }
                                };
                                var ret = bozuko.sanitize('facebook_result', fb_res);
                                res.send(ret);
                            }
                        );
                    });
                });
            } else {
                callback();
            }

        });
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
                    return bozuko.error('facebook/no_lat_lng').send(res);
                }

                var params = {
                    latLng: {lat:lat, lng:lng},
                    message: msg
                };

                run(req, res, 'checkin', params, function() { checkin(res, req.session.user._id, id, lat, lng, msg); });
            }
        }
    },

    '/facebook/:id/like': {

        post: {

            access: 'user',

            handler : function(req, res){
                run(req, res, 'like', {}, function() { like(req, res); });
            }
        }
    }

};
