var bozuko = require('bozuko');

var http = bozuko.require('util/http'),
    merge= require('connect').utils.merge;

var facebook = module.exports;

var cache = bozuko.facebook_cache = {};

exports.graph = function(path, options, callback){


    if( !/^\//.test(path) ) path = '/'+path;

    if( callback === undefined && typeof options == 'function'){
        callback = options;
        options = {};
    }
    var params = {
        client_id : bozuko.config.facebook.app.id,
        access_token : bozuko.config.facebook.app.access_token
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

    http.request({
        url: url,
        method: options.method,
        params: params,
        callback : function(){
            /**
             * If we want to debug all facebook requests it can go here..
             */
            var then = new Date();
            if(useCache) cache[cacheKey] = {arguments:arguments, time:then, duration:then.getTime()-now.getTime()};

            bozuko.last_facebook_time = then.getTime() - now.getTime();
            if( !bozuko.facebook_requests ) bozuko.facebook_requests={};
            if( !bozuko.facebook_requests[url] ) bozuko.facebook_requests[url] = [];
            bozuko.facebook_requests[url].push(bozuko.last_facebook_time);
            if (callback instanceof Function) callback.apply(this,arguments);
            else console.log("Weird... why are you calling facebook graph method ["+path+"] with no callback?");
        },
        scope : options.scope,
        returnJSON : options.returnJSON
    });
};