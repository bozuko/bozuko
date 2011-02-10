var http = Bozuko.require('util/http'),
    merge= require('connect/connect/utils').merge;

var facebook = module.exports;

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
    http.request({
        url: url,
        method: options.method || 'get',
        params: params,
        callback : function(){
            /**
             * If we want to debug all facebook requests it can go here..
             */
            
            if (callback instanceof Function) callback.apply(this,arguments);
            else console.log("Weird... why are you calling facebook graph method ["+path+"] with no callback?");
        },
        scope : options.scope || this,
        returnJSON : options.returnJSON !== undefined ? options.returnJSON : true
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