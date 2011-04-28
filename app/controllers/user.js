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
                logout: "String",
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
            doc: "Logout of Bozuko"
        }
    }
};

exports.routes = {

    '/user/login/:service?' : {

        description :"User login - sends user to facebook",

        aliases     :['/login/:service?'],

        get : function(req,res){
            
            // if we are being redirected with a token, its internal
            if( req.param('token')){
                // lets show the response screen
                return res.send('Will clean this up to look good...');
            }
            
            service = req.param('service') || 'facebook';
            if( req.param('return') ){
                req.session.user_redirect = req.param('return');
            }
            else if(req.param('phone_id') && req.param('phone_type')){
                req.session.user_redirect = '/user/mobile'
            }
            return Bozuko.service(service).login(req,res,'user',req.session.user_redirect||'/user');
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
                    user.commit('favorites');
                    return user.save(function(error){
                        console.log(JSON.stringify(user.favorites));
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
                        user.commit('favorites');
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
