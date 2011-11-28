exports.transfer_objects= {
    entry_point: {
        doc: "The entry point object of the application. If a user token is passed, the "+
             "user and prizes links will be provided, otherwise, the login link will be present.",

        def: {
            links: {
                pages: "String",
                login: "String",
                bozuko : "String",
                user: "String",
                prizes: "String"
            }
        }
    },

    error: {
        doc: "The generic error object",

        def: {
            code: "Number",
            name: "String",
            title: "String",
            message: "String",
            links: {
            }
        }
    },

    bozuko: {
        doc: "Bozuko Meta Object",
        create: function(obj, user, callback){
            var ret = {
                links:{
                    privacy_policy: '/bozuko/privacy_policy',
                    terms_of_use: '/bozuko/terms_of_use',
                    about: '/bozuko/about',
                    bozuko_for_business:'/bozuko/for_business'
                }
            };
            if( obj.page ){
                ret.links.bozuko_page = '/page/'+obj.page.id;
            }
            if( obj.demo_page ){
                ret.links.bozuko_demo_page = '/page/'+obj.demo_page.id;
            }
            // delete obj.page;
            return callback(null, ret);
        },
        def:{
            links: {
                privacy_policy: "String",
                terms_of_use: "String",
                about: "String",
                bozuko_for_business: "String",
                my_account: "String",
                bozuko_page: "String",
                bozuko_demo_page : "String"
            }
        }
    },

    content: {
        doc: "Bozuko Content Object",
        def:{
            content: "String"
        }
    },

    success_message:{
        doc:"Generic success message",
        def:{
            success: "Boolean",
            title: "String",
            message: "String"
        }
    }
};

if( Bozuko.env() == 'development'){
    exports.transfer_objects.error.def.stack = "String";
}

exports.links = {
    api: {
        get: {
            doc: "The entry point of the application",
            returns: "entry_point"
        }
    },
    bozuko: {
        get: {
            doc: "Retrieve information about Bozuko",
            returns: "bozuko"
        }
    },
    privacy_policy:{
        get: {
            doc: "Return the Privacy Policy",
            returns: "content"
        }
    },
    terms_of_use:{
        get: {
            doc: "Return the Terms of Use",
            returns: "content"
        }
    },
    about:{
        get: {
            doc: "About Bozuko Content",
            returns: "content"
        }
    },
    bozuko_for_business:{
        get: {
            doc: "Bozuko For Business",
            returns: "content"
        }
    },
    my_account:{
        get: {
            doc: "My Account",
            returns: "content"
        }
    },
    bozuko_page:{
        get: {
            doc: "Bozuko Page - for the 'Play our Game' button",
            returns: "page"
        }
    },
    bozuko_demo_page:{
        get: {
            doc: "Bozuko Demonstration Page - for the 'Demo Games' button",
            returns: "page"
        }
    }
};
