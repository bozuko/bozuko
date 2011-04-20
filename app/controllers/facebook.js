
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
            access: 'mobile',
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
            returns: ["game_state"]
        }
    },

    facebook_like: {
        post: {
            access: 'user',
            doc: "Like a facebook page and receive tokens",
            returns: ["game_state"]
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
            access: 'mobile',

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
                                //test: true,
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
                                        var ret = {
                                            page_id: page.id,
                                            page_name: page.name,
                                            timestamp: checkin.timestamp,
                                            duration: Bozuko.config.checkin.duration.page,
                                            games: Bozuko.transfer('game', games),
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
    },

    /**
     * Facebook Realtime updates
     *
     */
    '/facebook/pubsub':{

        /**
         * This is posted as a json object with application/json content-type
         * header
         */
        post: {
            handler : function(req, res){
                var object = req.param('object');
                var entry = req.param('entry');
                if( undefined === entry || false === entry ) return res.send({});
                if( !Array.isArray(entry) ) entry = [entry];

                switch(req.param('object')){

                    case 'user':
                        var ids = [];
                        entry.forEach(function(user){
                            var uid = user.uid;
                            if( ~user.changed_fields.indexOf('likes') ) ids.push(uid);
                        });
                        return Bozuko.models.User.updateFacebookLikes(ids, function(){
                            res.send({});
                        });


                    case 'permissions':
                        /**
                         * TODO
                         *
                         * track permissions in the internal object
                         */
                        return res.send({});


                    default:
                        return res.send({});
                }
            }
        },
        get: {
            handler : function(req, res){
                var verify = req.param('hub.verify_token');
                if( verify != Bozuko.config.facebook.app.pubsub_verify ){
                    return res.send('invalid subscription verify token', 500);
                }
                // okay, we are good.
                console.log('Facebook subscription for '+req.param('hub.mode')+' is setup');
                return res.send(req.param('hub.challenge'));
            }
        }

    }

};
