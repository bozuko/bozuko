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
            returns: ["facebook_checkin_result"]
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
            // TODO: send a real facebook_checkin_result and save this in the db
            return res.send({
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
                return bozuko.models.Page.findByService('facebook', id, function(err, page) {
                    
                    if( err ){
                        return err.send( res );
                    }
                    var do_checkin = function(page){
                        page.checkin(
                            req.session.user,
                            {
                                test: true,
                                service: 'facebook', // if this is omitted, try to checkin everywhere
                                latLng: {lat:lat,lng:lng},
                                message: msg
                            },
                            function(error, checkin_result){
                                if( error ){
                                    error.send(res);
                                }
                                else{
                                    res.send(
                                        bozuko.transfer(
                                            'facebook_checkin_result',
                                            checkin_result
                                        )
                                    );
                                }
                            }
                        );
                    };
                    
                    // if there is no page for this place yet, lets create one
                    if( !page ){
                        return bozuko.service('facebook').place(id, function(error, place){
                            if( error ) return error.send(res);
                            if( !place ){
                                return bozuko.error('facebook/bad_place_id').send(res);
                            }
                            return bozuko.models.Page.createFromServiceObject( place, function(error, page){
                                if( error ) return error.send(res);
                                return do_checkin(page);
                            });
                        });
                    }
                    return do_checkin(page);
                });
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
