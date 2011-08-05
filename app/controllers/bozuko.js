var content = Bozuko.require('util/content'),
    filterFn = Bozuko.require('util/functions').filter,
    Profiler = Bozuko.require('util/profiler')
;

exports.transfer_objects= {
    bozuko: {
        doc: "Bozuko Meta Object",
        create: function(obj, user, callback){
            var ret = {
                links:{
                    privacy_policy: '/bozuko/privacy_policy',
                    terms_of_use: '/bozuko/terms_of_use',
                    about: '/bozuko/about',
                    bozuko_for_business:'/bozuko/for_business'
                }
            };
            if( obj.page ){
                ret.links.bozuko_page = '/page/'+obj.page.id;
            }
            if( obj.demo_page ){
                ret.links.bozuko_demo_page = '/page/'+obj.demo_page.id;
            }
            // delete obj.page;
            return callback(null, ret);
        },
        def:{
            links: {
                privacy_policy: "String",
                terms_of_use: "String",
                about: "String",
                bozuko_for_business: "String",
                bozuko_page: "String",
                bozuko_demo_page : "String"
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
            success: "Boolean",
            title: "String",
            message: "String"
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
    terms_of_use:{
        get: {
            doc: "Return the Terms of Use",
            returns: "content"
        }
    },
    about:{
        get: {
            doc: "About Bozuko Content",
            returns: "content"
        }
    },
    bozuko_for_business:{
        get: {
            doc: "Bozuko For Business",
            returns: "content"
        }
    },
    bozuko_page:{
        get: {
            doc: "Bozuko Page - for the 'Play our Game' button",
            returns: "page"
        }
    },
    bozuko_demo_page:{
        get: {
            doc: "Bozuko Demonstration Page - for the 'Demo Games' button",
            returns: "page"
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
                    
                    // the return...
                    var transfer = function(page, demo_page){
                        return Bozuko.transfer('bozuko',{page: page, demo_page: demo_page || false}, null, function(error, result){
                            res.send( error || result );
                        });
                    };
                    
                    if( !Bozuko.config.bozuko.demo_id ){
                        return transfer( page );
                    }
                    return Bozuko.models.Page.findById( Bozuko.config.bozuko.demo_id, function(error, demo_page){
                        if( error ) return error.send(res);
                        return transfer(page, demo_page);
                    });
                });
            }
        }
    },

    'bozuko/privacy_policy': {
        get : {
            handler : function(req, res){

                render_page(res,'Privacy Policy', content.get('app/privacy.md', '<p>Coming soon...</p>') );
            }
        }
    },

    'bozuko/terms_of_use': {
        get : {
            handler : function(req, res){
                render_page(res,'Terms of Use', content.get('app/terms.md', '<p>Coming soon...</p>'));
            }
        }
    },
    'bozuko/about': {
        get : {
            handler : function(req, res){
                render_page(res,'About Bozuko', content.get('app/about.md', '<p>Coming soon...</p>'));
            }
        }
    },
    'bozuko/for_business': {
        get : {
            handler : function(req, res){
                render_page(res,'Bozuko for Business', content.get('app/b4b.md', '<p>Coming soon...</p>'));
            }
        }
    },
    'listen' : {
        post : {
            handler : function(req, res){
                var body = req.body,
                    buffer = 1000,
                    messages = [],
                    timeout_duration = 30000,
                    timeout = null
                    ;

                if( !body || !body.listeners || typeof body.listeners != 'object'){
                    res.send(messages);
                    return;
                }

                var listeners = {};

                var unsubscribe = function(){
                    var prof = new Profiler('/controllers/bozuko/listen/unsubscribe');
                    for( var event in listeners ){
                        listeners[event].forEach(function(listener){
                            Bozuko.unsubscribe(event, listener);
                        });
                    }
                    req.connection.removeListener('timeout', unsubscribe);
                    req.connection.removeListener('end', unsubscribe);
                    req.connection.removeListener('close', unsubscribe);
                    req.connection.removeListener('error', unsubscribe);
                    prof.stop();
                };
                var seen = [],
                    sent = false,
                    send = function(){
                        clearTimeout( timeout );
                        unsubscribe();
                        if( !sent && !res._headersSent ) res.send(messages);
                    };

                var onItem = function(item){
                    
                    var msg = item.message,
                        type = item.type,
                        timestamp = item.timestamp,
                        _id = item._id;
                    
                    var prof = new Profiler('/controllers/bozuko/listen/onItem');
                    var all_filters = [body.listeners[type],body.listeners['*']],
                        add = false;


                    if( ~seen.indexOf(+item._id) ){
                        return;
                    }
                    seen.push(+item._id);
                    // i don't think there will be more than 20 distinct listeners per event...
                    if( seen.length > 20 ) seen.shift();

                    for(var i = 0; i<all_filters.length && !add; i++ ){
                        var filters = all_filters[i];
                        if( !filters ) continue;
                        if( filters === true ){
                            add = true;
                            continue;
                        }
                        if( Array.isArray(filters) ){
                            for( var j=0; j<filters.length && !add; j++){
                                var filter = filters[j];

                                if( filter === true ){
                                    add=true;
                                    break;
                                }

                                var keys = Object.keys(filter),
                                    length = keys.length,
                                    match = 0;

                                for(var k=0; k<length && !add; k++){
                                    var key = keys[k];
                                    if( msg[key] && String(msg[key]) === String(filter[key]) ){
                                        match++;
                                    }
                                    if( match === length ){
                                        add = true;
                                    }
                                }
                            };
                        }
                    }
                    if( add ){
                        if( !messages.length ){
                            setTimeout(send, buffer);
                        }
                        messages.push(filterFn(item));
                    }
                    prof.stop();
                };

                var subscribe = function(){
                    var prof = new Profiler('/controllers/bozuko/listen/subscribe');
                    
                    // well, if its listening for everything, than just return everything,
                    // don't bother with individual listeners
                    if( body.listeners['*'] && body.listeners['*'] === true || (Array.isArray(body.listeners['*']) && ~body.listeners['*'].indexOf(true)) ){
                        body.listeners = {'*':[true]};
                    }
                    for( var event in body.listeners ){

                        // distinct callbacks - we need to create a separate
                        // one for each event / filter
                        var listener = function(item){
                            onItem(item);
                        };
                        Bozuko.subscribe(event, listener);
                        if( !listeners[event] ) listeners[event] = [];
                        listeners[event].push(listener);
                    }
                    prof.stop();
                };

                req.connection.addListener('timeout',   unsubscribe);
                req.connection.addListener('end',       unsubscribe);
                req.connection.addListener('close',     unsubscribe);
                req.connection.addListener('error',     unsubscribe);

                if( req.param('since') ){
                    var since = req.param('since');
                    Bozuko.pubsub.since( since, function(error, items){
                        if( error ) return error.send( res );
                        subscribe();
                        return items.forEach(function(item){
                            try{
                                onItem(item);
                            }catch(e){
                                // protect ourself from evil
                            }
                        });
                    });
                }
                else{
                    subscribe();
                }
                timeout = setTimeout(send, timeout_duration);
            }
        }
    }
};
