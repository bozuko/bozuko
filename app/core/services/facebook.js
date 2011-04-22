var URL         = require('url'),
    http        = Bozuko.require('util/http'),
    merge       = require('connect').utils.merge,
    qs          = require('querystring'),
    url         = require('url'),
    facebook    = Bozuko.require('util/facebook'),
    Service     = Bozuko.require('core/service')
;

var FacebookService = module.exports = function(){
    Service.apply(this,arguments);
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
    var self = this;

    if( defaultReturn ){
        req.session.redirect = defaultReturn;
    }

    var protocol = (req.app.key?'https:':'http:');

    var params = {
        'client_id' : Bozuko.config.facebook.app.id,
        'scope' : Bozuko.config.facebook.perms[scope],
        'redirect_uri' : protocol+'//'+Bozuko.config.server.host+':'+Bozuko.config.server.port+url.pathname
    };

    if( req.param('display')){
        params.display = req.param('display');
        req.session.display = req.param('display');
    }

    else if( req.session.device == 'touch'){
        params.display = 'touch';
    }

    if( !code && !error_reason ){
        // we need to send this person to facebook to get the code...
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
        params.client_secret = Bozuko.config.facebook.app.secret;
        params.code = code;

        console.log(req.session);


        // we should also have the user information here...
        var ret = req.session.redirect || defaultReturn;
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
                        user.token = token;
                        user = self.sanitizeUser(user);
                        Bozuko.models.User.addOrModify(user, req.session.phone, function(err, u) {
                            if (err) {
                                console.log("Facebook login error: "+err);
                                return err.send(res);
                            }
                            // okay, definitely a little weird mr. mongoose...
                            // after a save, we need to do a get user or embedded docs
                            // get messed up... yokay

                            return Bozuko.models.User.findById(u.id, function(error, u){

                                var finish = function(){
                                    var device = req.session.device;
                                    req.session.regenerate(function(err){
                                        //res.clearCookie('fbs_'+Bozuko.config.facebook.app.id);
                                        req.session.userJustLoggedIn = true;
                                        req.session.user = u;
                                        req.session.device = device;

                                        if( success ){
                                            if( success(u,req,res) === false ){
                                                return;
                                            }
                                        }
                                        res.redirect(ret || '/user');
                                    });
                                };
                                // specifically for facebook, we are going to monitor
                                // the user "likes" AND the "permissions" objects
                                // in the interal service object
                                var internal = u.service('facebook').internal;
                                if( internal && internal.subscriptions ) return finish();
                                return self.user_favorites({user:u},function(error, user){
                                    u.service('facebook').internal = {
                                        likes: user.data.likes
                                    };
                                    u.commit('facebook.internal');
                                    u.save(function(error){
                                        /**
                                         * TODO
                                         *
                                         * error conditions for login
                                         */
                                        return finish();
                                    });
                                });

                            });
                        });
                    });
                } else {
                    if( failure ){
                        if( failure('Authentication Failed', req, res) === false ){
                            return;
                        }
                    }
                    res.send("<html><h1>Facebook authentication failed :( </h1></html>");
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
 *      center : [lng,lat],
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
    var self = this;
    if( !options || !(options.center || options.query) ){
        return callback(Bozuko.error('facebook/no_lat_lng_query'));
    }

    var params = {
        type : options.center ? 'place' : 'page'
    };

    if( options.center ) params.center = options.center[1]+','+options.center[0];
    console.log(params.center);
    if( options.query ) params.q = options.query;
    if( !options.fields ) {
        options.fields = ['name','category','checkins','location'];
    }
    else if( !~options.fields.indexOf('checkins') ){
        options.fields.push('checkins');
    }
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
            // these need to be mapped to
            // generic Bozuko.objects
            callback(null, self.sanitizePlaces(results.data));
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
        return callback(Bozuko.error('facebook/no_lat_lng_user_place'));
    }

    var params = {
        place           :options.place_id,
        coordinates     :JSON.stringify({latitude:options.latLng.lat,longitude: options.latLng.lng})
    };
    if( options.name )          params.name         = options.name;
    if( options.message )       params.message      = options.message;
    if( options.picture )       params.picture      = options.picture;
    if( options.link )          params.link         = options.link;
    if( options.description )   params.description  = options.description;
    if( options.actions )       params.actions      = JSON.stringify(options.actions);

    if( options.test ){
        return callback(null, {id:134574646614657});
    }

    return facebook.graph('/me/checkins',{
        user: options.user,
        params: params,
        method:'post'
    },function(result){
        // check the result..
        if( result.error ){
            callback( Bozuko.error('facebook/api', result.error) );
        }
        callback(null, result);
    });
};


/**
 * Get a user's details
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
$.user = function(options, callback){

    if( !options || !(options.user_id  || options.user) ){
        return callback(Bozuko.error('facebook/no_user'));
    }

    var uid = options.user_id || options.user.service('facebook').sid;

    var params ={};
    if( options.fields )        params.fields       = options.fields;

    var self = this;
    return facebook.graph('/'+uid,{
        user: options.user,
        params: params
    },function(result){
        if( result.error ){
            callback( Bozuko.error('facebook/api', result.error) );
        }
        callback(null, self.sanitizeUser(result));
    });
};

/**
 * Get a user's favorites
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
$.user_favorites = function(options, callback){
    options.fields = 'likes';
    return this.user(options, callback);
};


/**
 * Like a page
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
$.like = function(options, callback){

    if( !options || !options.object_id || !options.user ){
        return callback(Bozuko.error('facebook/no_page_id_user'));
    }
    var params = {};

    if( options.message )       params.message      = options.message;
    if( options.picture )       params.picture      = options.picture;
    if( options.link )          params.link         = options.link;
    if( options.description )   params.description  = options.description;
    if( options.actions )       params.actions      = JSON.stringify(options.actions);

    if( options.test ){
        return callback(null, {result:123123123});
    }

    return facebook.graph('/'+options.object_id+'/likes',{
        user: options.user,
        method:'post'
    },function(result){
        if( result.error ){
            return callback( Bozuko.error('facebook/api', result.error) );
        }
        return callback(null, result);
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
    var self = this;
    if( !options || !options.place_id ){
        return callback(Bozuko.error('facebook/no_page_id'));
    }

    var params = {};
    if( options.fields ){
        params.fields = options.fields.join(',');
    }
    facebook.graph('/'+options.place_id, {
        params: params
    },function(result){
        if( result.error ){
            return callback( Bozuko.error('facebook/api', result.error) );
        }
        return callback(null, self.sanitizePlace(result) );
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
    var self = this;
    facebook.graph('/me/accounts',
        {
            user: user,
            params:{
                fields:['id','name','category','likes','location'].join(',')
            }
        },
        function(accounts){
            var pages = [];
            var ids = [];
            if( accounts && accounts.data ) accounts.data.forEach(function(account){
                delete account.access_token;
                account = self.sanitizePlace(account);
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

            pages.sort(sort_FacebookPageLocationLikes);
            

            if( ids.length > 0 ){
                Bozuko.models.Page.find({'services.name':'facebook','services.sid':{$in:ids}}, function(err, bozuko_pages){
                    if( bozuko_pages != null ) bozuko_pages.forEach(function(bozuko_page){
                        var i = ids.indexOf(bozuko_page.service('facebook').sid);
                        pages[i].has_owner = true;
                        pages[i].is_owner = (bozuko_page.owner_id == user._id);
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
 * Private santiziatin method
 *
 * MUST BE IMPLEMENTED IN IMPLEMENTATION
 *
 * This should return data in the following format
 * The data field can hold any extranneous information.
 *
 *  {
 *      id: Number,
 *      name: String,
 *      location: {
 *          street: String,
 *          city: String,
 *          state: String,
 *          country: String
 *          zip: String,
 *          lat: Number,
 *          lng: Number
 *      },
 *      image: String,
 *      data: Object
 *  }
 *
 * @param {Object}          place           The place to sanitize
 *
 * @return {Object}         place           The sanitized object / objects
 */
$._sanitizePlace = function(place){
    if( !place ) return null;
    if( !place.location ) place.location = {};
    return {
        service: 'facebook',
        id: place.id,
        checkins: place.checkins||0,
        likes: place.likes,
        name: place.name,
        category: place.category,
        image: 'https://graph.facebook.com/'+place.id+'/picture?type=large',
        location: {
            street: place.location.street || '',
            city: place.location.city || '',
            state: place.location.state || '',
            country: place.location.country || 'United States',
            zip: place.location.zip || '',
            lat: place.location.latitude || 0,
            lng: place.location.longitude || 0
        },
        data: place
    };
};



/**
 * Private santiziation method for users
 *
 * MUST BE IMPLEMENTED IN IMPLEMENTATION
 *
 * This should return data in the following format
 * The data field can hold any extranneous information.
 *
 *  {
 *      id: Number,
 *      name: String,
 *      firstName: String,
 *      lastName: String,
 *      email: String,
 *      phone: String,
 *      image: String,
 *      data: Object
 *  }
 *
 * @param {Object}          place           The place to sanitize
 *
 * @return {Object}         place           The sanitized object / objects
 */
$._sanitizeUser = function(user){

    if( !user ) return null;
    return {
        service: 'facebook',
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        image: 'http://graph.facebook.com/'+user.id+'/picture?type=large',
        email: user.email,
        gender: user.gender,
        data: user
    };
};

/**
 * Utility Functions
 */

function sort_FacebookPageLocationLikes(a,b){
    var a_has_location = a.location && a.location.lat;
    var b_has_location = b.location && b.location.lng;
    if( b_has_location && !a_has_location ) return 1;
    if( a_has_location && !b_has_location ) return -1;
    // now sort by likes
    return (b.likes||0) - (a.likes||0);
}
