var URL         = require('url'),
    merge       = require('connect').utils.merge,
    qs          = require('querystring'),
    url         = require('url'),
    Geo         = Bozuko.require('util/geo'),
    Service     = Bozuko.require('core/service')
;

var BozukoService = module.exports = function(){
    Service.apply(this,arguments);
};

BozukoService.prototype.__proto__ = Service.prototype;

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
BozukoService.prototype.login = function(req,res,scope,defaultReturn,success,failure){};

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
BozukoService.prototype.search = function(options, callback){};


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
BozukoService.prototype.checkin = function(options, callback){

    if( !options || !options.place_id || !options.ll || !options.user ){
        return callback(Bozuko.error('facebook/no_lat_lng_user_place'));
    }
    
    console.log(options.place_id);
    // we just need to find the place and compare distance
    return Bozuko.models.Page.findById( options.place_id, function(error, page){
        if( error ) return callback( error );
        if( !page ) return callback( Bozuko.error('page/not_found') );
        // get the distance now
        var d = Geo.distance( options.ll, page.coords, 'mi' );
        if( d > Bozuko.cfg('config.checkin.distance', 600) / 5280 ){
            // too far...
            return callback( Bozuko.error( 'checkin/too_far') );
        }
        return callback( null, {} );
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
BozukoService.prototype.user = function(options, callback){};

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
BozukoService.prototype.user_favorites = function(options, callback){};


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
BozukoService.prototype.like = function(options, callback){ };

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
BozukoService.prototype.place = function(options, callback){ };

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

BozukoService.prototype.get_user_pages = function(user, callback){};

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
BozukoService.prototype._sanitizePlace = function(place){};



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
BozukoService.prototype._sanitizeUser = function(user){};
