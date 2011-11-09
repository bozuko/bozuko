var async = require('async'),
    http = Bozuko.require('util/http');

exports.links = {
    facebook_checkin: {
        post: {
            doc: "Checkin to facebook and receive tokens",
            access: 'mobile',
            params: {
                ll: {
                    required: true,
                    type: "String",
                    description: "The users latitude and longitude in lat,lng format"
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
            returns: ["success_message"]
        }
    }
};

exports.session = false;

exports.routes = {

    '/facebook/:id/checkin': {
        post: {

            access: 'mobile',

            handler: function(req, res) {
                
                console.log(req.body);

                var id = req.param('id');
                var ll = req.param('ll');
                var accuracy = req.param('accuracy') || false;
                var msg = (req.param('message') || '').replace(/^\s\s*/, '').replace(/\s\s*$/, '');

                if( msg == '') msg = null;

                if( !ll ){
                    return Bozuko.error('facebook/no_lat_lng').send(res);
                }
                var parts = ll.split(',');
                if( parts.length != 2 ){
                    return Bozuko.error('facebook/no_lat_lng').send(res);
                }
                ll = [parseFloat(parts[1]),parseFloat(parts[0])];

                return Bozuko.models.Page.findByService('facebook', id, function(err, page) {

                    if( err ){
                        return err.send( res );
                    }
                    var do_checkin = function(page){
                        page.checkin(req.session.user, {
                            service: 'facebook', // if this is omitted, try to checkin everywhere
                            ll: ll,
                            accuracy: accuracy,
                            message: msg
                        },function(error){
                            if( error ){
                                return error.send(res);
                            }
                            return res.send([]);
                        });
                    };

                    // if there is no page for this place yet, lets create one
                    if( !page ){
                        return Bozuko.service('facebook').place({place_id:id}, function(error, place){
                            if( error ){
                                return error.send(res);
                            }
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

    '/facebook/:id/like.html': {

        alias : '/facebook/:id/like_button.html',

        get: {

            title : "Like a business on Facebook",

            locals:{
                classes:['like'],
                device: 'touch'
            },

            handler : function(req, res){

                var tmpl = ( /like_button/.test(req.url) ) ? 'like_button' : 'like';
                if( tmpl == 'like_button' ){
                    res.locals.layout = false;
                }
                res.locals.user = req.session.user;
                res.locals.isAndroid = req.header('user-agent').match(/android/i);
                
                var page,
                    place,
                    access_token,
                    fbid = req.param('id');
                
                return  async.series([
                    function get_page(cb){
                        Bozuko.models.Page.findByService('facebook', fbid, function(error, _page){
                            if( error ) return cb(error);
                            if( _page ) page = _page;
                            return cb();
                        });
                    },
                    
                    function get_user(cb){
                        if( !page ) return cb();
                        if( !page.admins || !page.admins.length ) return cb();
                        var user_id = page.admins[0];
                        return Bozuko.models.User.findOne({_id:user_id}, function (error, user){
                            if( error ) return cb(error);
                            if( user && user.service('facebook') ){
                                access_token = user.service('facebook').auth;
                            }
                            return cb();
                        });
                    },
                    
                    function get_place(cb){
                        var options = {
                            place_id: fbid
                        };
                        if( access_token ) options.access_token = access_token;
                        return Bozuko.service('facebook').place(options, function( error, _place){
                            if( error ) return cb(error);
                            place = _place;
                            return cb();
                        });
                    }
                ], function render(error){
                    if( error ){
                        res.locals.error = error;
                        return res.render('app/facebook/'+tmpl);
                    }
                    
                    res.locals.place = place;
                    
                    if( !place ){
                        return res.render('app/facebook/'+tmpl);
                    }
                    
                    if(page){
                        res.locals.place.image = page.image;
                        res.locals.place.category = page.category;
                        res.locals.place.name = page.name;
                    }
                    if( res.locals.place.image.indexOf('type=large') ){
                        res.locals.place.image = res.locals.place.image.replace(/type=large/, 'type=square');
                    }
                    res.locals.title = "Like "+place.name+" on Facebook!";
                    return res.render('app/facebook/'+tmpl);
                });
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

                if( Bozuko.env() === 'api'){

                    // because api is the most stable, lets let that handle all these
                    // notifications and then alert the places we think are necessary
                    var urls = [
                        'https://playground.bozuko.com:443/facebook/pubsub',
                        'https://playground.bozuko.com:8001/facebook/pubsub'
                    ];
                    var body = String(req.rawBody);
                    async.forEachSeries(urls, function(url, cb){
                        // launch an async request to our internal pubsubs
                        Bozuko.require('util/http').request({
                            method      :'post',
                            url         :url,
                            headers     : {
                                'content-type': 'application/json'
                            },
                            body        :body,
                            encoding    :'utf-8'
                        }, function(error){
                            if( error ) return cb(error);
                            console.log('notified '+url);
                            return cb();
                        });
                    }, function (error){
                        if(error) console.error(error);
                    });
                }

                console.log('pubsub body');
                console.log(req.rawBody);

                if( undefined === entry || false === entry ) return res.send({});
                if( !Array.isArray(entry) ) entry = [entry];
                switch(object){

                    case 'user':
                        var ids = [];
                        return async.forEachSeries(entry, function(fb_user, cb){
                            var uid = fb_user.uid;
                            return Bozuko.models.User.findByService('facebook', uid, function(err, user){
                                if( err ) return cb(err);
                                if( user ){
                                    return user.updateInternals(true, function(error){
                                        console.log('Updated Facebook internals for '+user.name);
                                        return cb(error);
                                    });
                                }
                                return cb();
                            });
                        }, function(error){
                            return res.send({});
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
