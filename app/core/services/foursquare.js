var URL         = require('url'),
    http        = Bozuko.require('util/http'),
    merge       = require('connect').utils.merge,
    qs          = require('querystring'),
    url         = require('url'),
    Service     = Bozuko.require('core/service')
;

var FoursquareService = module.exports = function(){
    Service.apply(this,arguments);
};

FoursquareService.prototype.__proto__ = Service.prototype;

var $ = FoursquareService.prototype;

function api(path, options, callback){
    // lets get the user details now...
    var params = {};
    options = options || {};
    options.params = options.params || {};
    if( !/^\//.test(path) ) path='/'+path;
    if( options.user && !options.params.oauth_token ){
        var service = options.user.service('foursquare');
        if( service ){
            options.params.oauth_token = service.auth;
        }
    }
    if( !options.params.oauth_token ){
        params.client_id = Bozuko.config.foursquare.app.id;
        params.client_secret = Bozuko.config.foursquare.app.secret;
    }
    merge(params, options.params || {});

    var _callback = function(response){
        if( !response || response.meta.code != 200 ){
            return callback( Bozuko.error('foursquare/api', response.meta) );
        }
        return callback( null, response.response );
    };

    http.request({
        url: 'https://api.foursquare.com/v2'+path,
        params: params,
        method:options.method||'GET',
        returnJSON: true,
        callback: _callback
    });
}

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
        'client_id' : Bozuko.config.foursquare.app.id,
        'response_type' : 'code',
        'redirect_uri' : protocol+'//'+Bozuko.config.server.host+':'+Bozuko.config.server.port+url.pathname
    };

    if( req.session.device == 'touch'){
        params.display = 'touch';
    }

    if( !code && !error_reason ){
        // we need to send this person to facebook to get the code...
        var ret = req.param('return');
        req.session.redirect = ret;
        res.redirect('https://foursquare.com/oauth2/authenticate?'+qs.stringify(params));
    }
    else if( error_reason ){
        /**
         * Handle denied access
         */
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
        delete params['response_type'];
        params.client_secret = Bozuko.config.foursquare.app.secret;
        params.code = code;
        params.grant_type = 'authorization_code';

        // we should also have the user information here...
        var ret = req.session.redirect || defaultReturn;

        http.request({
            url: 'https://foursquare.com/oauth2/access_token',
            params: params,
            returnJSON: true,
            callback : function foursquare_callback(result){

                if( result['access_token'] ) {
                    // grab the access token
                    var token = result['access_token'];
                    // lets get the user details now...
                    api('/users/self',
                        {params:{oauth_token : token}},
                        function(error, result){
                            if( !error ){
                                if( failure ){
                                    if( failure(error, req, res) === false ){
                                        return null;
                                    }
                                }
                                return res.send("<html><h1>Foursquare authentication failed :( </h1></html>");
                            }
                            var user = result.user;
                            user.token = token;
                            Bozuko.models.User.addOrModify(user, 'foursquare', function(err, u){
                                if (err) {
                                    console.log("Foursquare login error: "+err);
                                    return err.send(res);
                                }
                                var device = req.session.device;
                                req.session.regenerate(function(err){
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
                            });
                        }
                    );
                } else {
                    if( failure ){
                        if( failure('Authentication Failed', req, res) === false ){
                            return;
                        }
                    }
                    res.send("<html><h1>Foursquare authentication failed :( </h1></html>");
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
    if( !options || !options.center ){
        return callback( Bozuko.error('foursquare/search_no_lat_lng') );
    }
    var params = {
        ll : options.center[1]+','+options.center[0],
        intent: 'checkin',
        limit: options.limit || 25
    };
    if( options.query ){
        params.query = query;
    }

    var self = this;

    return api('/venues/search', {params:params}, function(error,  response){
        if( error ){
            return callback(error);
        }
        /**
         * TODO
         *
         * We need to convert all of these objects to transferrable objects
         */
        var places = [];
        response.groups.forEach(function(group){
            group.items.forEach( function(item){
                places.push(item);
            });
        });
        return callback( null, self.sanitizePlaces(places) );
    });
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
        return callback( Bozuko.error('foursquare/no_venue_id') );
    }

    var params = {};
    var self = this;

    return api('/venues/'+options.place_id, {params:params}, function(error,  response){

        if( error ){
            return callback(error);
        }
        /**
         * TODO
         *
         * We need to convert all of these objects to transferrable objects
         */
        var places = [];
        return callback( null, self.sanitizePlace(response.venue) );
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
 *      category: String,
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
    var data = {
        service: 'foursquare',
        id: place.id,
        name: place.name,
        checkins: place.stats.checkinsCount,
        location: {
            address: place.location.street || '',
            city: place.location.city || '',
            state: place.location.state || '',
            country: place.location.country || 'United States',
            zip: place.location.postalCode || '',
            lat: place.location.lat || 0,
            lng: place.location.lng || 0
        },
        data: place
    };
    if( place.categories && place.categories.length ){
        var cat = place.categories[0];
        data.category = cat.name;
        data.image = cat.icon.replace(/\.png$/, '_64.png');
    }
    return data;
};
