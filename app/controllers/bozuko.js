exports.transfer_objects= {
    bozuko: {
        doc: "Bozuko Meta Object",
        create: function(){
            return {
                links:{
                    privacy_policy: '/bozuko/privacy_policy',
                    how_to_play: '/bozuko/how_to_play',
                    about: '/bozuko/about',
                    bozuko_for_business:'/bozuko/for_business'
                }
            }
        },
        def:{
            links: {
                privacy_policy: "String",
                how_to_play: "String",
                about: "String",
                bozuko_for_business: "String"
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
    privacy_policy:{
        get: {
            doc: "Return the Privacy Policy",
            returns: "content"
        }
    },
    about:{
        get: {
            doc: "About Bozuko Content",
            returns: "content"
        }
    },
    how_to_play:{
        get: {
            doc: "How To Play",
            returns: "content"
        }
    },
    bozuko_for_business:{
        get: {
            doc: "Bozuko For Business",
            returns: "content"
        }
    }
};

exports.session = false;

exports.routes = {
    '/dev/reset' : {
        get : {
            handler: function(req, res){
                Bozuko.require('dev/setup').init(function(){
                    res.send('reset the development environment');
                });
            }
        }
    },
    
    '/bozuko' : {
        get : {
            handler: function(req,res){
                res.send(Bozuko.transfer('bozuko',{}));
            }
        }
    }
};
