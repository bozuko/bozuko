var content = Bozuko.require('util/content'),
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
                    how_to_play: '/bozuko/how_to_play',
                    about: '/bozuko/about',
                    bozuko_for_business:'/bozuko/for_business'
                }
            };
            if( obj.page ){
                ret.links.bozuko_page = '/page/'+obj.page.id;
            }
            // delete obj.page;
            return callback(null, ret);
        },
        def:{
            links: {
                privacy_policy: "String",
                terms_of_use: "String",
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
    },
    bozuko_page:{
        get: {
            doc: "Bozuko Page - for the 'Play our Game' button",
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
                    return Bozuko.transfer('bozuko',{page: page}, null, function(error, result){
                        res.send( error || result );
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
                render_page(res,'Terms of Use', '<p>Coming soon...</p>');
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
    },
    'listen' : {
        post : {
            handler : function(req, res){
                var body = req.body,
                    buffer = 500,
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

                var send = function(){
                    clearTimeout( timeout );
                    unsubscribe();
                    res.send(messages);
                };

                var seen = [];

                var onItem = function(msg, type, timestamp, _id){
                    var prof = new Profiler('/controllers/bozuko/listen/onItem');
                    var all_filters = [body.listeners[type],body.listeners['*']],
                        add = false;


                    if( ~seen.indexOf(String(_id)) ){
                        return;
                    }
                    seen.push(String(_id));
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
                            for( var i=0; i<filters.length && !add; i++){
                                var filter = filters[i];

                                if( filter === true ){
                                    add=true;
                                    break;
                                }

                                var keys = Object.keys(filter),
                                    length = keys.length,
                                    match = 0;

                                for(var i=0; i<length && !add; i++){
                                    var key = keys[i];
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
                        messages.push({
                            type: type,
                            message: msg,
                            timestamp: timestamp,
                            _id: _id
                        });
                    }
                    prof.stop();
                };

                var subscribe = function(){
                    var prof = new Profiler('/controllers/bozuko/listen/subscribe');
                    // well, if its listening for everything, than just return everything, don't bother with individual listeners
                    if( body.listeners['*'] && body.listeners['*'] === true || (Array.isArray(body.listeners['*']) && ~body.listeners['*'].indexOf(true)) ){
                        body.listeners = {'*':[true]};
                    }
                    for( var event in body.listeners ){

                        // distinct callbacks - we need to create a separate
                        // one for each event / filter
                        var listener = function(msg, type, timestamp, _id){
                            onItem(msg, type, timestamp, _id);
                        };
                        Bozuko.subscribe(event, listener);
                        if( !listeners[event] ) listeners[event] = [];
                        listeners[event].push(listener);
                    }
                    prof.stop();
                };

                req.connection.addListener('timeout', unsubscribe);
                req.connection.addListener('end', unsubscribe);
                req.connection.addListener('close', unsubscribe);
                req.connection.addListener('error', unsubscribe);

                if( req.body.since ){
                    Bozuko.pubsub.since( req.body.since, function(error, items){
                        if( error ) return error.send( res );
                        subscribe();
                        return items.forEach(function(item){
                            try{
                                onItem(item.content, item.type, item.timestamp, item._id);
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
