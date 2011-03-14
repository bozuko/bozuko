var bozuko = require('bozuko');
var http = bozuko.require('util/http');

exports.transfer_objects = {
    prize: {
        doc: "Bozuko Prize Object",
        def: {
            id: "Number",
            state: "String",
            name: "String",
            place: "String",
            win_time: "Date",
            redemption_time: "Date",
            expiration_time: "Date",
            business_img: "String",
            user_img: "String",
            background_img: "String",
            links: {
                page: string,
                contest: string,
                user: string
            }
        }
    }
};

exports.links = {
    prizes: {
        get: {
            doc:  "Return a list of prizes",
            params: {
                context: {
                    type: "String",
                    values: ['user', 'global'],
                    description: "Describe which prizes to search"
                },
                state: {
                    type: "String",
                    values: ['active', 'redeemed', 'expired'],
                    description: "The state of the prizes to search"
                }
            },
            returns: ["prize"]
        }
    },

    prize: {
        get: {
            doc: "Get a specific prize",
            returns: "prize"
        }
    },

    redemption: {
        post: {
            doc: "Redeem a prize"
        }
    }
};

exports.routes = {

    '/prize/:id' : {

	get : {
        }
    },

    '/prize/:id/redemption' : {

	post : {
        }
    }
};