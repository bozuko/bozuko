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
            img: "String",
            links: {
                facebook_login: "String",
                facebook_logout: "String",
                favorites: "String"
            }
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
                "center":{
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

    facebook_login: {
        get: {
            doc: "Login to facebook",
            params: {
                phone_type: {
                    required: true,
                    type: "String",
                    description: "The type of phone"
                },
                phone_id: {
                    required: true,
                    type: "String",
                    description: "The unique id of the phone"
                }
            }
        }
    },

    facebook_logout: {
        get: {
            doc: "Logout of facebook"
        }
    }
};

exports.routes = {

    '/user/login/:service?' : {

        description :"User login - sends user to facebook",

        aliases     :['/login/:service?'],

        get : function(req,res){
            service = req.param('service') || 'facebook';
            if( req.param('return') ){
                req.session.user_redirect = req.param('return');
            }
            return Bozuko.service(service).login(req,res,'user',req.session.user_redirect||'/user');
        }
    },

    '/user/logout' : {

        description :"User logout",

        aliases: ['/logout'],

        get : function(req,res){
            req.session.destroy(function(){
                res.redirect('/');
            });
        }
    },

    '/user' : {

        get : {

            access: 'user',

            handler: function(req, res) {
                var user = req.session.user;
                user.id = user._id;
                user.links = {
                    facebook_login: "/user/login/facebook",
                    facebook_logout: "/user/logout/facebook",
                    favorites: "/user/"+user.id+"/favorites"
                };
                res.send(Bozuko.transfer('user', user));
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
                var center = req.param('center');
                res.redirect('/pages?favorites=true&center='+center+'&token='+token);
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
                if( favorites ) for(var i=0; i<favorites.length && found == false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                    }
                }
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
                        return res.send(Bozuko.transfer('favorite_response', {
                            added: true,
                            page_id: id
                        }));
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

                if( favorites ) for(var i=0; i<favorites.length && found === false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                    }
                }
                if( found === false ){
                    return Bozuko.error('user/favorite_does_not_exist').send(res);
                }
                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    user.favorites.splice(found,1);
                    // weird mongoose shit...
                    if( user.favorites.length === 0 ) user.favorites = [];
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return res.send(Bozuko.transfer('favorite_response', {
                            removed: true,
                            page_id: id
                        }));
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

                if( favorites ) for(var i=0; i<favorites.length && found === false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                    }
                }
                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    var ret = {
                        page_id: id
                    };
                    if( found !== false ){
                        user.favorites.splice(found,1);
                        if( user.favorites.length === 0 ) user.favorites = [];
                        ret.removed = true;
                    }
                    else{
                        user.favorites.push(id);
                        ret.added = true;
                    }
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return res.send(Bozuko.transfer('favorite_response', ret));
                    });
                });
            }
        }
    },

    '/user/prizes' : {

        get : {

            access: 'user',

            handler: function(req, res) {


            }
        }
    }
};
