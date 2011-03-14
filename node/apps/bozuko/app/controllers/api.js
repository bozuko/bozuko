exports.transfer_objects = {
    entry_point: {
        doc: "The entry point object of the application",

        def: {
            links: {
                pages: "String",
                facebook_login: "String",
                bozuko : "String"
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

exports.routes = {};