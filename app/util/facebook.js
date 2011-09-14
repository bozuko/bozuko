var http = Bozuko.require('util/http'),
    merge= require('connect').utils.merge;

var facebook = module.exports;

var cache = Bozuko.facebook_cache = {};

exports.graph = function(path, options, callback){


    if( !/^\//.test(path) ) path = '/'+path;

    if( callback === undefined && typeof options == 'function'){
        callback = options;
        options = {};
    }
    var params = {
        client_id : Bozuko.config.facebook.app.id,
        access_token : Bozuko.config.facebook.app.access_token
    };

    options = options || {};
    if( options.user && options.user.service('facebook') ){
        params.access_token = options.user.service('facebook').auth;
    }
    else if( options.req && options.req.session.user && options.req.session.user.service('facebook') ){
        params.access_token = req.session.user.service('facebook').auth;
    }

    if( options.params ) params = merge(params, options.params);
    var url = 'https://graph.facebook.com'+path;
    /*
    if( /\/pages/.test(url) || /\/search/.test(url) ){
        url = 'http://graph.facebook.com'+path;
        delete params.access_token;
    }
    */
    var now = new Date();

    if( !options.method ) options.method = 'get';
    if( !options.scope ) options.scope = this;
    if( options.returnJSON === undefined ) options.returnJSON = true;

    /**
     * Facebook Caching...
     *
     */
    var useCache = false;
    var fakeRequestTime = false;
    var expire = 1000 * 60 * 10; // 10 minute expiration
    var cacheKey = JSON.stringify({path:path,options:options});
    if( useCache && cache[cacheKey] && cache[cacheKey].arguments && now.getTime() - cache[cacheKey].time.getTime() < expire ){
        if( callback instanceof Function ){
            // should we fake the request time?
            console.log("using facebook cache");
            setTimeout(function(){
                callback.apply(options.scope, cache[cacheKey].arguments );
            }, fakeRequestTime ? cache[cacheKey].duration : 0 );
        }

        return;
    }
    
    var opts = {
        url: url,
        method: options.method,
        params: params,
        timeout: 20000,
        returnJSON : options.returnJSON
    };
    
    var http_callback = function(err, result){

        if (err){
            if( false && err.type == 'http/timeout' && !opts.isRetry ){
                opts.timeout = 10000;
                opts.isRetry = true;
                return http.request(opts, http_callback);
            }
            return callback(err);
        }

        if( result.error && callback ){
            // handle bogus sessions
            if( result.error.message.match(/changed the password/i) ){
                return callback( Bozuko.error('facebook/auth') );
            }
            // log the error...
            console.error( JSON.stringify( result.error, null, '  ') );
            return callback( Bozuko.error('facebook/api', result.error ));
        }

        /**
         * If we want to debug all facebook requests it can go here..
         */
        var then = new Date();
        
        if(useCache) cache[cacheKey] = {arguments:arguments, time:then, duration:then.getTime()-now.getTime()};
        
        Bozuko.last_facebook_time = then.getTime() - now.getTime();
        
        if( !Bozuko.facebook_requests ){
            Bozuko.facebook_requests={};
        }
        if( !Bozuko.facebook_requests[url] ){
            Bozuko.facebook_requests[url] = [];
        }
        
        Bozuko.facebook_requests[url].push(Bozuko.last_facebook_time);
        
        if (callback instanceof Function){
            return callback.apply(this,[null, result]);
        }
        else{
            return console.log("Weird... why are you calling facebook graph method ["+path+"] with no callback?");
        }
    };
    http.request(opts, http_callback);
};