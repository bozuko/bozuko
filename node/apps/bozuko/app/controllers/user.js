var bozuko = require('bozuko');

exports.transfer_objects= {
    user: {
        
        doc: "Bozuko User Object",
        
        def:{
            id: "Number",
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
