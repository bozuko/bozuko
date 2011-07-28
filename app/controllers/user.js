var Profiler = Bozuko.require('util/profiler');
var inspect = require('util').inspect;

exports.transfer_objects= {
    user: {

        doc: "Bozuko User Object",

        def:{
            id: "String",
            token: "String",
            name: "String",
            first_name: "String",
            last_name: "String",
            gender: "String",
            email: "String",
            challenge: "String",
            img: "String",
            image: "String",
            links: {
                logout: "String",
                favorites: "String"
            }
        },

        create : function(data, user, callback){
            data.image = data.image.replace(/type=large/, 'type=square');
            data.img = data.image;
            return this.sanitize(data, null, user, function(error, result){
                if( error ) return callback(error);
                return callback(null, result);
            });
        }
    },

    favorites: {
        doc: "Bozuko User Favorites",
        def: ["page"]
    },

    favorite_response: {
        doc: "The response from a favorite add or delete",
        def: {
            added: "Boolean",
            removed: "Boolean",
            page_id: "String"
        }
    }
};

exports.links = {
    user: {
        get: {
            access: 'user',
            doc: "Get Information about the user",
            returns: "user"
        }
    },

    favorites: {

        get: {
            access: 'user',
            doc: "Get users favorites",
            params: {
                "ll":{
                    required:true,
                    type:"String",
                    description:"The latitude, longitude of the user (see pages link documentation)"
                }
            },
            returns: ['page']
        }
    },

    favorite: {

        put: {
            access: 'user',
            doc: "Add a page to a user's favorites",
            returns: 'favorite_response'
        },
        del: {
            access: 'user',
            doc: "Remove a page from a user's favorites",
            returns: 'favorite_response'
        },
        post: {
            access: 'user',
            doc: "Toggle a page as a user's favorite",
            returns: 'favorite_response'
        }
    },

    login: {
        get: {
            params: {
                phone_type: {
                    required: true,
                    type: "String",
                    description: "The type of phone (iphone4, etc)"
                },
                phone_id: {
                    required: true,
                    type: "String",
                    description: "The unique id of the phone (udid)"
                }
            }
        }
    },

    logout: {
        get: {
            access: 'user',
            doc: "Logout of Bozuko",
            returns: 'success_message'
        }
    }
};

exports.session = false;

exports.routes = {

    '/user/login/:service?' : {

        description :"User login - sends user to facebook",

        aliases     :['/login/:service?'],

        get : function(req,res){

            // if we are being redirected with a token, its internal
            if( req.param('token')){
                // lets show the response screen
                res.locals.user = req.session.user;
                res.locals.title = 'You are Logged In';
                return res.render('app/user/login_thanks')
            }

            service = req.param('service') || 'facebook';
            if( req.param('return') ){
                req.session.user_redirect = req.param('return');
            }
            else if(req.param('phone_id') && req.param('phone_type')){
                req.session.device='touch';
                req.session.user_redirect = '/user/mobile';
            }
            return Bozuko.service(service).login(
                req,
                res,
                'user',
                req.session.user_redirect||'/user',
                null,
                function(error_reason, req, res){
                    res.locals.title = ":'(";
                    res.render('app/user/permission_denied');
                    return false;
                }
            );
        }
    },

    '/user/mobile' : {
        get : {

            access: 'user',
            handler: function(req,res){
                var token = req.session.user.token;
                res.redirect('/user/login?token='+token);
            }
        }
    },

    '/user/logout' : {

        description :"User logout",

        aliases: ['/logout'],

        get : {

            handler: function(req,res){
                return res.send( {success: true, title: "Logout", message: "You have been logged out"} );
            }
        }
    },

    '/user' : {

        get : {

            access: 'user',

            handler: function(req, res) {
                var user = req.session.user;
                // we should update the user's likes

                return user.updateInternals( true, function(error){
                    if( error ) return error.send(res);
                    user.id = user._id;
                    user.links = {
                        logout: "/user/logout",
                        favorites: "/user/favorites"
                    };
                    console.error('user = '+inspect(user));
                    return Bozuko.transfer('user', user, user, function(error, result){
                        if (result) {
                            console.error('\nuser transfer = '+inspect(result)+'\n\n');
                        } else {
                            console.error('\n no transfer user\n');
                        }
                        res.send( error || result );
                    });
                });
            }
        }
    },

    '/user/favorites' : {

        get : {
            access: 'user',

            handler: function(req, res) {
                // a get request is just all favorites
                // we need to have the token by now...
                var token = req.param('token');
                var ll = req.param('ll');
                if( !token || !ll ){
                    return Bozuko.error('user/favorites_no_ll').send(res);
                }
                return res.redirect('/pages?favorites=true&ll='+ll+'&token='+token);
            }
        }

    },

    '/user/favorite/:id':{

        put: {
            access: 'user',
            handler: function(req, res) {
                var id = req.param('id');
                var user = req.session.user;
                var favorites = user.favorites;
                var found = false;

                var prof = new Profiler('/controllers/user/favorite/put');
                if( favorites ) for(var i=0; i<favorites.length && found == false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                        break;
                    }
                }
                prof.stop();
                if( found !== false ){
                    return Bozuko.error('user/favorite_exists').send(res);
                }
                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ){
                        return error.send(res);
                    }
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    user.favorites.push(id);
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return Bozuko.transfer('favorite_response', {
                            added: true,
                            page_id: id
                        }, user, function(error, result){
                            res.send( error || result );
                        });
                    });
                });
            }
        },

        del: {
            access: 'user',
            handler: function(req, res) {
                var id = req.param('id');
                var user = req.session.user;
                var favorites = user.favorites;
                var found = false;

                var prof = new Profiler('/controllers/user/favorite/del');
                if( favorites ) for(var i=0; i<favorites.length && found === false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                        break;
                    }
                }
                prof.stop();
                if( found === false ){
                    return Bozuko.error('user/favorite_does_not_exist').send(res);
                }
                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    user.favorites.splice(found,1);
                    // weird mongoose shit...
                    user.commit('favorites');
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return Bozuko.transfer('favorite_response', {
                            removed: true,
                            page_id: id
                        }, user, function(error, result){
                            res.send( error || result );
                        });
                    });
                });
            }
        },

        post: {
            access: 'user',
            handler: function(req, res) {
                var id = req.param('id');
                var user = req.session.user;
                var favorites = user.favorites;
                var found = false;

                var prof = new Profiler('/controllers/user/favorite/post');
                if( favorites ) for(var i=0; i<favorites.length && found === false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                        break;
                    }
                }
                prof.stop();

                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    var ret = {
                        page_id: id
                    };
                    if( found !== false ){
                        user.favorites.splice(found,1);
                        user.commit('favorites');
                        ret.removed = true;
                    }
                    else{
                        user.favorites.push(id);
                        ret.added = true;
                    }
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return Bozuko.transfer('favorite_response', ret, user, function(error, result){
                            return res.send( error || result );
                        });
                    });
                });
            }
        }
    }
};
