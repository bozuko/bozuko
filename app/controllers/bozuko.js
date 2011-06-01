exports.transfer_objects= {
    bozuko: {
        doc: "Bozuko Meta Object",
        create: function(obj){
            var ret = {
                links:{
                    privacy_policy: '/bozuko/privacy_policy',
                    terms_and_conditions: '/bozuko/terms_and_conditions',
                    how_to_play: '/bozuko/how_to_play',
                    about: '/bozuko/about',
                    bozuko_for_business:'/bozuko/for_business'
                }
            };
            if( obj.page ){
                ret.links.bozuko_page = '/page/'+obj.page.id;
            }
            return ret;
        },
        def:{
            links: {
                privacy_policy: "String",
                terms_and_conditions: "String",
                how_to_play: "String",
                about: "String",
                bozuko_for_business: "String",
                bozuko_page: "String"
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
    terms_and_conditions:{
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

function render_page(res, title, content){
    res.locals.title = title || 'Coming Soon...';
    res.locals.content = content || '';
    res.render('app/content');
}

exports.routes = {
    
    '/bozuko' : {
        get : {
            handler: function(req,res){
                
                // we need to find the bozuko page...
                Bozuko.models.Page.findByService('facebook', Bozuko.config.bozuko.facebook_id, function(error, page){
                    if( error ) return error.send(res);
                    return res.send(Bozuko.transfer('bozuko',{page: page}));
                });
            }
        }
    },
    
    'bozuko/privacy_policy': {
        get : {
            handler : function(req, res){
                render_page(res,'Privacy Policy','<p>Coming soon...</p>');
            }
        }
    },
    
    'bozuko/terms_and_conditions': {
        get : {
            handler : function(req, res){
                render_page(res,'Terms and Conditions', '<p>Coming soon...</p>');
            }
        }
    },
    'bozuko/about': {
        get : {
            handler : function(req, res){
                render_page(res,'About Bozuko', '<p>Coming soon...</p>');
            }
        }
    },
    'bozuko/how_to_play': {
        get : {
            handler : function(req, res){
                render_page(res,'How to Play', '<p>Coming soon...</p>');
            }
        }
    },
    'bozuko/for_business': {
        get : {
            handler : function(req, res){
                render_page(res,'Bozuko for Business', '<p>Coming soon...</p>');
            }
        }
    }
};
