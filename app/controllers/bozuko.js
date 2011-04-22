exports.transfer_objects= {
    bozuko: {
        doc: "Bozuko Meta Object",
        def:{
            links: {
                privacy_policy: "String",
                how_to_play: "String",
                rules: "String",
                about: "String",
                creating_contest: "String"
            }
        }
    },
    
    success_message:{
        doc:"Generic success message",
        def:{
            success: "Boolean"
        }
    }
};

exports.links = {
    bozuko: {
        get: {
            doc: "Retrieve information about Bozuko",
            returns: "bozuko"
        }
    },
    bozuko_accept_terms: {
        put: {
            doc: "Accept the Bozuko terms of use",
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

exports.routes = {};
