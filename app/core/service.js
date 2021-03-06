/**
 * Abstract Service Class
 */
var Service = module.exports = function(){
    
};

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
Service.prototype.login = function(req,res,scope,defaultReturn,success,failure){};

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
 * lngLat is required
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
Service.prototype.search = function(options, callback){};


/**
 * Checkin to the service
 *
 * 
 * The callback will be passed 2 arguments
 *
 *      error
 *      data
 *
 *          TODO - figure out what to pass for data, maybe the id of the checkin in the service
 *
 * @param {String/Number}   place_id        Id of the place within the service
 * @param {User}            user            Bozuko user
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
Service.prototype.checkin = function(place_id, user, callback){};


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
 * @param {Page}            place_id        Id of the place within the service
 * @param {User}            user            Bozuko User
 * @param {Object}          options         Checkin specific options
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
Service.prototype.like = function(options, callback){}

/**
 * Post to feed
 *
 * The callback will be passed 2 arguments
 *
 *      error
 *      data
 *
 * @param {Object}          options         Post specific options
 * @param {Function}        callback        Callback Function
 *
 * @option {User}           user            The user (required)
 * @option {String}         message         The message for the wall post
 * @option {Number}         place_id        The service specific id
 *
 * @return {null}
 */
Service.prototype.post = function(options, callback){ return callback( Bozuko.error('bozuko/not_implemented') ); }


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
 *      data - The service data for the place
 *
 * @param {String/Number}   place_id        Id of the place within the service
 * @param {Array}           fields          Fields to be returned
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
Service.prototype.place = function(place_id, fields, callback){};

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
Service.prototype.get_user_pages = function(user, callback){};


/**
 * Private santiziatin method
 *
 * MUST BE IMPLEMENTED IN IMPLEMENTATION
 *
 * This should return data in the following format
 * The data field can hold any extranneous information.
 * 
 *  {
 *      service: String,
 *      id: Number,
 *      name: String,
 *      location: {
 *          address: String,
 *          city: String,
 *          state: String,
 *          postal_code: String,
 *          lat: Number,
 *          lng: Number
 *      },
 *      checkins: Number,
 *      image: String,
 *      data: Object
 *  }
 * 
 * @param {Object}          place           The place to sanitize
 *
 * @return {Object}         place           The sanitized object / objects
 */
Service.prototype._sanitizePlace = function(place){};

/**
 * Sanitize a place
 *
 * @param {Mixed}           places/place    The array of places or place to sanitize
 *
 * @return {Mixed}          places/place    The sanitized object / objects
 */
Service.prototype.sanitizePlace = Service.prototype.sanitizePlaces = function(place){
    if( !Array.isArray(place) ) return this._sanitizePlace(place);
    var ret = [];
    var self = this;
    place.forEach(function(item){ ret.push( self._sanitizePlace(item)); } );
    return ret;
};

Service.prototype._sanitizeUser = function(user){};

/**
 * Sanitize a place
 *
 * @param {Mixed}           places/place    The array of places or place to sanitize
 *
 * @return {Mixed}          places/place    The sanitized object / objects
 */
Service.prototype.sanitizeUser = Service.prototype.sanitizeUser = function(user){
    if( !Array.isArray(user) ) return this._sanitizeUser(user);
    var ret = [];
    var self = this;
    user.forEach(function(item){ ret.push( self._sanitizeUser(item)); } );
    return ret;
};

