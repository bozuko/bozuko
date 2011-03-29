
var facebook_result = {
    doc: "Result from a Facebook Operation",
    def:{
        page_id : "String",
        page_name: "String",
        timestamp: "String",
        duration: "Number",
        games: ['game'],
        links: {
            facebook_like: "String"
        }
    }
};

exports.transfer_objects = {
    facebook_result: {
        doc: "Result from a Facebook Operation",
        def:{
            id: "Number",
            tokens: "Number",
            timestamp: "String",
            duration: "Number",
            links: {
                facebook_like: "String"
            }
        }
    }
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

var like = function(req, res) {
    Bozuko.service('facebook').like({
        test: true,
        user: req.session.user._id,
        link        :'http://Bozuko.com',
        picture     :'http://Bozuko.com/images/Bozuko.chest-check.png',
        description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
        object_id   : req.param('id')
    },
    function(err, result) {
        if (err) {
            return err.send(res);
        }
        // TODO: send a real result
        return res.send({
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
                    return Bozuko.error('facebook/no_lat_lng').send(res);
                }
                
                return Bozuko.models.Page.findByService('facebook', id, function(err, page) {
                    
                    if( err ){
                        return err.send( res );
                    }
                    var do_checkin = function(page){
                        page.checkin(
                            req.session.user,
                            {
                                // test: true,
                                service: 'facebook', // if this is omitted, try to checkin everywhere
                                latLng: {lat:lat,lng:lng},
                                message: msg
                            },
                            function(error, result){
                                if( error ){
                                    return error.send(res);
                                }
                                
                                var checkin = result.checkin;
                                var entries = result.entries;
                                
                                return checkin.getPage(function(error, page){
                                    
                                    if( error ) return error.send(res);
                                    
                                    return page.getUserGames(req.session.user, function(error, games){
                                        if( error ) return error.send(res);
                                        
                                        games.forEach(function(game, i){
                                            games[i] = Bozuko.transfer('game').create(game);
                                        });
                                        
                                        var ret = {
                                            page_id: page.id,
                                            page_name: page.name,
                                            timestamp: checkin.timestamp,
                                            duration: Bozuko.config.checkin.duration.page,
                                            games: games,
                                            links: {
                                                facebook_like: '/facebook/'+page.service('facebook').sid+'/like'
                                            }
                                        };
                                        
                                        return res.send(ret);
                                    });
                                    
                                });
                                
                            }
                        );
                    };
                    
                    // if there is no page for this place yet, lets create one
                    if( !page ){
                        return Bozuko.service('facebook').place(id, function(error, place){
                            if( error ) return error.send(res);
                            if( !place ){
                                return Bozuko.error('facebook/bad_place_id').send(res);
                            }
                            return Bozuko.models.Page.createFromServiceObject( place, function(error, page){
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
