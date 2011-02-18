var http = Bozuko.require('util/http'),
    merge= require('connect/connect/utils').merge;

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
    if( options.user && options.user.facebook_auth ){
        params.access_token = options.user.facebook_auth;
    }
    else if( options.req && options.req.session.user && options.req.session.user.facebook_auth ){
        params.access_token = req.session.user.facebook_auth;
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
    var fakeRequestTime = false;
    var expire = 1000 * 60 * 10; // 10 minute expiration
    var cacheKey = JSON.stringify({path:path,options:options});
    if( cache[cacheKey] && cache[cacheKey].arguments && now.getTime() - cache[cacheKey].time.getTime() < expire ){
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
            cache[cacheKey] = {arguments:arguments, time:then, duration:then.getTime()-now.getTime()};
            
            Bozuko.last_facebook_time = then.getTime() - now.getTime();
            if( !Bozuko.facebook_requests ) Bozuko.facebook_requests={};
            if( !Bozuko.facebook_requests[url] ) Bozuko.facebook_requests[url] = [];
            Bozuko.facebook_requests[url].push(Bozuko.last_facebook_time);
            if (callback instanceof Function) callback.apply(this,arguments);
            else console.log("Weird... why are you calling facebook graph method ["+path+"] with no callback?");
        },
        scope : options.scope,
        returnJSON : options.returnJSON
    });
};

exports.get_accounts = function(user,callback){
    
    facebook.graph('/me/accounts',
        {
            user: user,
            params:{
                fields: 'id,name,fan_count,location,category'
            }
        },
        function(accounts){
            var pages = [];
            var ids = [];
            if( accounts && accounts.data ) accounts.data.forEach(function(account){
                delete account.access_token;
                if( account.location && account.location.latitude ){
                    account.is_place = true;
                }
                else{
                    account.is_place = false;
                }
                // ignore any accounts that do not have a name...
                if( account.name ){
                    account.has_owner = false;
                    account.is_owner = false;
                    pages.push(account);
                    ids.push(account.id);
                }
            });
            
            pages.sort(sort_FacebookPageFanCount);
            pages.sort(sort_FacebookPageLocation).reverse();
            
            if( ids.length > 0 ){
                Bozuko.models.Page.find({facebook_id:{$in:ids}}, function(bozuko_pages){
                    if( bozuko_pages != null ) bozuko_pages.forEach(function(bozuko_page){
                        var i = ids.indexOf(bozuko_page.facebook_id);
                        pages[i].has_owner = true;
                        pages[i].is_owner = (bozuko_page.owner_id.id == user._id.id);
                    });
                    callback(pages);
                });
            }
            else{
                callback(pages);
            }
        }
    );
}

/**
 * Utility Functions
 */

function sort_FacebookPageLocation(a,b){
    var a_has_location = a.location && a.location.latitude;
    var b_has_location = b.location && b.location.latitude;
    if( a_has_location && !b_has_location ) return 1;
    if( b_has_location && !a_has_location ) return -1;
    return 0;
}
function sort_FacebookPageFanCount(a,b){
    return (a.fan_count||0) - (b.fan_count||0);
}