var bozuko      = require('bozuko'),
    URL         = require('url'),
    http        = bozuko.require('util/http'),
    merge       = require('connect').utils.merge,
    qs          = require('querystring'),
    url         = require('url'),
    facebook    = bozuko.require('util/facebook'),
    Service     = bozuko.require('core/service')
;

var FacebookService = module.exports = function(){
    Service.call(this);
};

FacebookService.prototype.__proto__ = Service.prototype;

var $ = FacebookService.prototype;

/**
 * Login function
 *
 * @param {ServerRequest}   req             The current request
 * @param {ServerResponse}  res             The current response
 * @scope {String}          defaultReturn   The url to forward to after login
 * @param {Function}        success         A callback function on successful login.
 *                                          Takes an argument of the user
 * @param {Function}        failure         A callback function on login failure
 *
 * @returns {null}
 */
$.login = function(req,res,scope,defaultReturn,success,failure){
    var code = req.param('code');
    var error_reason = req.param('error_reason');
    var url = URL.parse(req.url);

    var protocol = (req.app.key?'https:':'http:');

    var params = {
        'client_id' : bozuko.config.facebook.app.id,
        'scope' : bozuko.config.facebook.perms[scope],
        'redirect_uri' : protocol+'//'+bozuko.config.server.host+':'+bozuko.config.server.port+url.pathname
    };

    if( req.session.device == 'touch'){
        params.display = 'touch';
    }

    if( !code && !error_reason ){
        // we need to send this person to facebook to get the code...
        var ret = req.param('return');
        req.session.redirect = ret;
        res.redirect('https://graph.facebook.com/oauth/authorize?'+qs.stringify(params));
    }
    else if( error_reason ){
        /**
         *          * Handle denied access
         *          */
        var ret = req.session.redirect || defaultReturn || '/';
        ret+= (ret.indexOf('?') != -1 ? '&' : '?')+'error_reason='+error_reason;

        if( failure ){
            if( failure(error_reason, req, res) === false ){
                return;
            }
        }

        res.redirect(ret);
    }
    else{

        params.client_secret = bozuko.config.facebook.app.secret;
        params.code = code;

        // we should also have the user information here...
        var ret = req.session.redirect;

        http.request({
            url: 'https://graph.facebook.com/oauth/access_token',
            params: params,
            callback : function facebook_callback(response){

                var result = qs.parse(response);
                if( result['access_token'] ) {
                    // grab the access token
                    var token = result['access_token'];

                    // lets get the user details now...
                    facebook.graph('/me', {
                        params:{
                            access_token : token
                        }
                    }, function(user){
                        bozuko.models.User.findOne({'services.name':'facebook','services.id':user.id}, function(err, u){
                            if( !u ){
                                u = new bozuko.models.User();
                            }
                            // update the user's details
                            u.name = user.name;
                            u.first_name = user.first_name;
                            u.last_name = user.last_name;
                            u.gender = user.gender;
                            u.email = user.email;
                            u.facebook_id = user.id;
                            u.facebook_auth = token;
                            
                            u.service('facebook', user.id, token, user);
                            
                            
                            u.save(function(){

                                var device = req.session.device;
                                req.session.regenerate(function(err){
                                    res.clearCookie('fbs_'+bozuko.config.facebook.app.id);
                                    req.session.userJustLoggedIn = true;
                                    req.session.user = u;
                                    req.session.device = device;
                                    if( success ){
                                        if( success(u,req,res) === false ){
                                            return;
                                        }
                                    }
                                    res.redirect(ret || '/');
                                });
                            });
                        });
                    });
                }
                else {
                    if( failure ){
                        if( failure('Authentication Failed', req, res) === false ){
                            return;
                        }
                    }
                    res.send("<html><h1>Facebook authentication failed :( </h1></html>")
                }
            },
            scope : this
        });
    }
};


/**
 * Location based search
 *
 * Accepts an options argument in the form of:
 *
 *  {
 *      latLng : {lng: Number, lat: Number},
 *      query : String,
 *      fields : Array
 *  }
 *
 * either latLng or query is required
 * query is a search string
 * fields is an array of requested fields. The following are permitted
 *
 *      name
 *      location
 *      description
 *      image
 *      checkins
 *
 * The callback will be passed 2 arguments
 *
 *      error
 *      data - an array of place Objects
 *
 *          TODO - define the return object
 *
 * @param {Object}          options         A search object
 * @param {Function}        callback        Callback function
 *
 * @return {null}
 */
$.search = function(options, callback){

    if( !options || !(options.latLng || options.query) ){
        callback(new Error(
            'FacebookService::search options requires latLng or search query'
        ));
        return;
    }

    var params = {
        type : 'place'
    };
    if( options.latLng ) params.center = options.latLng.lat+','+options.latLng.lng;
    if( options.query ) params.query = options.query;
    if( options.fields ){
        params.fields = options.fields.join(',');
    }

    params.offset = options.offset || 0;
    // this is a weird hack to get around facebooks "interpretation" of limiting...
    params.limit = (options.limit || 25) + params.offset;


    facebook.graph( '/search',
        /* Facebook Options */
        {
            params: params
        },
        function facebook_search(results){
            callback(null, results);
        }
    );
};


/**
 * Checkin to the service
 *
 * The options object
 *
 * The callback will be passed 2 arguments
 *
 *      error
 *      data
 *
 *          TODO - figure out what to pass for data, maybe the id of the checkin in the service
 *
 * @param {Page}            place_id        Bozuko Page
 * @param {User}            user            Bozuko User
 * @param {Object}          options         Checkin specific options
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
$.checkin = function(options, callback){

    if( !options || !options.place_id || !options.latLng || !options.user ){
        callback(new Error(
            'FacebookService::checkin requires place_id, latLng, and user as options'
        ));
        return;
    }

    var params = {
        place           :options.place_id,
        coordinates     :JSON.stringify({latitude:options.latLng.lat,longitude: options.latLng.lng})
    };
    if( options.message )       params.message      = options.message;
    if( options.picture )       params.picture      = options.picture;
    if( options.link )          params.link         = options.link;
    if( options.description )   params.description  = options.description;
    if( options.actions )       params.actions      = JSON.stringify(options.actions);

    facebook.graph('/me/checkins',{
        user: options.user,
        params: params,
        method:'post'
    },function(result){
        console.log(result);
        callback(null, result);
    });
};


/**
 * Get full info about a place by id
 *
 * fields is an array of requested fields. The following are permitted
 *
 *      name
 *      location
 *      description
 *      image
 *      checkins
 *
 * The callback will be passed 2 arguments
 *
 *      error
 *      data - The
 *
 * @param {Object}          options         Options object
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
$.place = function(options, callback){
    if( !options || !options.place_id ){
        callback(new Error(
            'FacebookService::checkin requires place_id as oneof the arguments'
        ));
        return;
    }

    var params = {};
    if( options.fields ){
        params.fields = options.fields.join(',');
    }
    facebook.graph('/'+options.place_id, {
        params: params
    },function(result){
        callback(null, result);
    });

};

/**
 * Get any places that this user is an administrator for
 *
 * The callback will be passed 2 arguments
 *
 *      error
 *      pages
 *
 * @param {User}            user            The user
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
$.get_user_pages = function(user, callback){

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
                bozuko.models.Page.find({'services.name':'facebook','services.id':{$in:ids}}, function(err, bozuko_pages){
                    if( bozuko_pages != null ) bozuko_pages.forEach(function(bozuko_page){
                        var i = ids.indexOf(bozuko_page.service('facebook').id);
                        pages[i].has_owner = true;
                        pages[i].is_owner = (bozuko_page.owner_id.id == user._id.id);
                    });
                    callback(null, pages);
                });
            }
            else{
                callback(null, pages);
            }
        }
    );
};


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
