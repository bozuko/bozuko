var async = require('async'),
    http = Bozuko.require('util/http'),
    inspect = require('util').inspect;

exports.session = false;

exports.routes = {

    '/facebook/:id/checkin': {
        post: {

            access: 'mobile',

            handler: function(req, res) {
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
                    game,
                    user,
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
                    
                    function get_game(cb){
                        var _id;
                        if(!page || !(_id=req.param('game'))) return cb();
                        return Bozuko.models.Contest.findOne({
                            _id: req.param('game'),
                            $or: [{
                                page_id: page._id
                            },{
                                page_ids: page._id
                            }]
                        }, function(error, _game){
                            if( error ) return cb(error);
                            if( _game ) game = _game;
                            return cb();
                        });
                    },

                    function get_user(cb){
                        if( !page ) return cb();
                        if( !page.admins || !page.admins.length ) return cb();
                        var user_id = page.admins[0];
                        return Bozuko.models.User.findOne({_id:user_id}, function (error, _user){
                            if( error ) return cb(error);
                            if( _user ) user = _user;
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
                        // if( access_token ) options.access_token = access_token;
                        return Bozuko.service('facebook').place(options, function( error, _place){
                            if( error ) return cb(error);
                            place = _place;
                            return cb();
                        });
                    },
                    
                    function get_link(cb){
                        // facebook is such a piece of garbage sometimes.
                        if( !place ) return cb(null);
                        var q = 'SELECT url FROM profile WHERE id = '+place.id;
                        
                        
                        
                        return Bozuko.require('util/facebook').graph('/fql', {
                            params:{q: q}
                        }, function(error, result){
                            if( error ) return cb( );
                            place.data.link = result.data[0].url;
                            return cb();
                        });
                    }
                    
                ], function render(error){
                    if( error ){
                        res.locals.error = error;
                        return res.render('app/facebook/'+tmpl);
                    }

                    res.locals.place = place;
                    if( !place.data.link ){ place.data.link = 'https://facebook.com/'+place.id; }

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
                    if(user){
                        res.locals.admin = user.service('facebook').sid;
                    }
                    res.locals.game = game;
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
                
                console.error('in facebook pubsub');

                var object = req.param('object');
                var entry = req.param('entry');
                console.log('pubsub entry = '+inspect(entry));
                console.log('pubsub object = '+inspect(object));

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
                        if(error) {
                            console.error(error);
                            console.log(error);
                        }
                    });
                }

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
                                        return cb(error);
                                    });
                                }
                                return cb();
                            });
                        }, function(error){
                            if (error) {
                                console.error(error);
                                console.log(error); // for context with the request
                            }
                            return res.send({});
                        });

                    case 'permissions':
                        /**
                         * TODO
                         *
                         * track permissions in the internal object
                         */
                         console.log('pubsub permissions');
                        return res.send({});


                    default:
                        console.log("pubsub default");
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

    },
    
    '/channel.html' : {
        get : {
            handler : function(req, res){
                var cache_expire = 60*60*24*365;
                res.header('Pragma', 'public');
                res.header('Cache-Control', 'max-age='+cache_expire);
                res.send(
                    '<script src="//connect.facebook.net/en_US/all.js"></script>'
                );
            }
        }
    }

};
