/**
 * Abstract Service Class
 */
var Service = exports.Service = function(){
    
};

var proto = Service.prototype;

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
proto.login = function(req,res,scope,defaultReturn,success,failure){};

/**
 * Location based search
 *
 * Accepts an options argument in the form of:
 * 
 *  {
 *      lngLat : {lng: Number, lat: Number},
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
proto.search = function(options, callback){};


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
proto.checkin = function(place_id, user, callback){};


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
 * @param {String/Number}   place_id        Id of the place within the service
 * @param {Array}           fields          Fields to be returned
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
proto.place = function(place_id, fields, callback){};