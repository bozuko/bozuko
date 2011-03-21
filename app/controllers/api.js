var bozuko = require('bozuko');

exports.transfer_objects = {
    entry_point: {
        doc: "The entry point object of the application",

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
            msg: "String",
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
                res.send(bozuko.transfer('entry_point', {links: links}));
            }
        }
    }
};