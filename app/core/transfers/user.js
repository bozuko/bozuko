exports.transfer_objects= {
    user: {

        doc: "Bozuko User Object",

        def:{
            id: "String",
            token: "String",
            name: "String",
            first_name: "String",
            last_name: "String",
            gender: "String",
            email: "String",
            ship_name: "String",
            address1: "String",
            address2: "String",
            city: "String",
            state: "String",
            zip: "String",
            challenge: "String",
            img: "String",
            image: "String",
            links: {
                logout: "String",
                favorites: "String"
            }
        },

        create : function(data, user, callback){
            data.image = data.image ? data.image.replace(/type=large/, 'type=square') : '';
            data.img = data.image;
            return this.sanitize(data, null, user, function(error, result){
                if( error ) return callback(error);
                return callback(null, result);
            });
        }
    },

    favorites: {
        doc: "Bozuko User Favorites",
        def: ["page"]
    },

    favorite_response: {
        doc: "The response from a favorite add or delete",
        def: {
            added: "Boolean",
            removed: "Boolean",
            page_id: "String"
        }
    },
    
    user_success_message:{
        doc:"Generic success message",
        def:{
            success: "Boolean",
            title: "String",
            message: "String",
            user: "user"
        }
    }
};

exports.links = {
    user: {
        get: {
            access: 'user',
            doc: "Get Information about the user",
            returns: "user"
        },
        post: {
            access: 'mobile',
            doc: "Update user info",
            params:{
                
                email: {
                    type: 'String',
                    description: 'Email Address'
                },
                ship_name: {
                    type: 'String',
                    description: 'Ship-to Name'
                },
                address1: {
                    type: 'String',
                    description: 'Address (line 1)'
                },
                address2: {
                    type: 'String',
                    description: 'Address (line 2)'
                },
                city: {
                    type: 'String',
                    description: 'City'
                },
                state: {
                    type: 'String',
                    description: 'State'
                },
                zip: {
                    type: 'String',
                    description: 'Zip Code'
                }
            },
            returns: "user_success_message"
        },
        put : {
            access: 'developer',
            doc: 'Create a new user',
            params: {
                service: {
                    type: 'String',
                    description: 'Name of service - only Facebook right now.'
                },
                data: {
                    type: 'Object',
                    description: 'User info'
                }
            },
            returns: 'user'
        }
    },

    favorites: {

        get: {
            access: 'user',
            doc: "Get users favorites",
            params: {
                "ll":{
                    required:true,
                    type:"String",
                    description:"The latitude, longitude of the user (see pages link documentation)"
                }
            },
            returns: ['page']
        }
    },

    favorite: {

        put: {
            access: 'user',
            doc: "Add a page to a user's favorites",
            returns: 'favorite_response'
        },
        del: {
            access: 'user',
            doc: "Remove a page from a user's favorites",
            returns: 'favorite_response'
        },
        post: {
            access: 'user',
            doc: "Toggle a page as a user's favorite",
            returns: 'favorite_response'
        }
    },

    login: {
        get: {
            params: {
                phone_type: {
                    required: true,
                    type: "String",
                    description: "The type of phone (iphone4, etc)"
                },
                phone_id: {
                    required: true,
                    type: "String",
                    description: "The unique id of the phone (udid)"
                }
            }
        }
    },

    logout: {
        get: {
            access: 'user',
            doc: "Logout of Bozuko",
            returns: 'success_message'
        }
    }
};
