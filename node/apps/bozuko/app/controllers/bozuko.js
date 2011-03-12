exports.object_types = {
    bozuko: {
        privacy_policy: "String",
        how_to_play: "String",
        rules: "String",
        about: "String",
        creating_contest: "String",
        terms: "String",
        links: {
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
    }
};