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
    }
};

exports.links = {
    user: {
        get: {
            doc: "Get Information about the user",
            returns: "user"
        }
    },

    favorites: {
        get: {
            doc: "Get the current user's favorite pages",
            returns: ["page"]
        },
        put: {
            doc: "Add a page to a user's favorites",
            params: {
                page_id: {
                    required: true,
                    type: "Number",
                    description: "The id of the page being added"
                }
            }
        },
        del: {
            doc: "Remove a page from a user's favorites",
            params: {
                page_id: {
                    required: true,
                    type: "Number",
                    description: "The id of the page being added"
                }
            }
        }
    },

    facebook_login: {
        get: {
            doc: "Login to facebook",
            params: {
                phone_type: {
                    type: "String",
                    description: "The type of phone"
                },
                phone_id: {
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
            Bozuko.service(service).login(req,res,'user','/user');
        }
    },

    '/user' : {

        get : {
            handler: function(req, res) {
                res.setHeader('content-type', 'application/json');
                if (req.session.user) {
                    var user = req.session.user;
                    user.id = user._id;
                    user.img = "https://graph.facebook.com/"+user.id+"/picture";
                    user.links = {
                        facebook_login: "/user/login/facebook",

                        facebook_logout: "/user/logout/facebook",
                        favorites: "/user/"+user.id+"/favorites"
                    };
                    res.send(Bozuko.transfer('user', user));
                } else {
                    res.statusCode = 404;
                    res.end();
                }
            }
        }
    },

    '/user/favorites' : {

        get : {
            handler: function(req, res) {
                if (req.session.user) {
                    var user = req.session.user;
                    Bozuko.models.Page.find({'_id': {$in: user.favorites}}, function(err, pages) {
                        if (err) {
                            console.log("ERROR - favorites: err = "+err);
                            res.statusCode = 404;
                            res.end();
                        } else {
                            if (pages) {
                                res.send(pages);
                            } else {
                                console.log("ERROR - favorites: pages not found");
                                res.statusCode = 404;
                                res.end();
                            }
                        }
                    });
                }
            }
        },

        put: {
            handler: function(req, res) {
            }
        },

        del: {
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
