exports.object_types = {
    bozuko: {
        privacy_policy: "String",
        how_to_play: "String",
        rules: "String",
        about: "String",
        creating_contest: "String",
        terms: {
            text: "String",
            accepted: "Boolean",
            timestamp: "Date"
        },
        links: {
            user: "String",
            bozuko_accept_terms: "String",
            contest: "String",
            contest_result: "String"
        }
    }
};

exports.links = {
    bozuko: {
        get: {
            description: "Retrieve information about bozuko",
            returns: "bozuko"
        }
    },
    bozuko_accept_terms: {
        put: {
            description: "Accept the Bozuko terms of use",
            params: {
                accept: {
                    required: true,
                    type: "Boolean",
                    description: "Does the user accept the the terms of use"
                }
            }
        }
    }
};
