exports.transfer_objects = {
    entry_point: {
        doc: "The entry point object of the application. If a user token is passed, the user and prizes links will be provided, otherwise, the facebook_login will be present.",

        def: {
            links: {
                pages: "String",
                facebook_login: "String",
                bozuko : "String",
                user: "String",
                prizes: "String"
            }
        }
    },

    error: {
        doc: "The generic error object",

        def: {
            name: "String",
            message: "String",
            links: {
            }
        }
    }
};

exports.links = {
    api: {
        get: {
            doc: "The entry point of the application",
            returns: "entry_point"
        }
    }
};

exports.routes = {
    '/api' : {
        get : {
            handler: function(req, res) {
                res.setHeader('content-type', 'application/json');
                var links = {
                    pages: "/pages",
                    bozuko: "/bozuko"
                };
                if (req.session.user) {
                    links.user = "/user/",
                    links.prizes = "/user/prizes";
                } else {
                    links.facebook_login = "/user/login/facebook";
                }
                res.send(Bozuko.transfer('entry_point', {links: links}));
            }
        }
    }
};