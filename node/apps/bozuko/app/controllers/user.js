var bozuko = require('bozuko');

exports.object_types = {
    user: {
        id: "Number",
        name: "String",
        first_name: "String",
        last_name: "String",
        gender: "String",
        email: "String",
        img: "String",
        links: {
            favorites: "String"
        }
    },

    favorites: ["page"]
};

exports.links = {
    user: {
        get: {
            description: "Get Information about the user",
            returns: "user"
        }
    },

    favorites: {
        get: {
            description: "Get the current user's favorite pages",
            returns: ["page"]
        },
        put: {
            description: "Add a page to a user's favorites",
            params: {
                page_id: {
                    required: true,
                    type: "Number",
                    description: "The id of the page being added"
                }
            }
        },
        del: {
            description: "Remove a page from a user's favorites",
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
            description: "Login to facebook",
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
    }
};

exports.routes = {

    '/user/login/:service?' : {

        description :"User login - sends user to facebook",

        aliases     :['/login/:service?'],

        get : function(req,res){
            service = req.param('service') || 'facebook';
            bozuko.service(service).login(req,res,'user');
        }
    },

    '/user/:id' : {

        get : {
        }
    },

    '/user/:id/favorites' : {

        get : {
        },

        put: {
        },

        del: {
        }
    },

    '/user/:id/prizes' : {

        get : {
        }
    }
};
