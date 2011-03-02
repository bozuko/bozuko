var bozuko      = require('bozuko'),
    URL         = require('url'),
    http        = bozuko.require('util/http'),
    merge       = require('connect').utils.merge,
    qs          = require('querystring'),
    url         = require('url')    
    facebook    = bozuko.require('util/facebook'),
    Service     = bozuko.require('core/service').Service
;
    
var FacebookService = exports.Service = function(){
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
   
    var params = {
        'client_id' : bozuko.config.facebook.app.id,
        'scope' : bozuko.config.facebook.perms[scope],
        'redirect_uri' : 'http://'+bozuko.config.server.host+':'+bozuko.config.server.port+url.pathname
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
        
        params.client_secret = bozuko.config.facebook.app.secret;
        params.code = code;
        
        console.log(code);
        
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
                        bozuko.models.User.findOne({facebook_id:user.id}, function(err, u){
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
$.search = function(options, callback){
    
    if( !options || !options.latLng ){
        callback(new Error(
            'FacebookService::search options requires latLng'
        ));
    }
    
    var params = {
        type : 'place'
    };
    params.center = options.latLng.lat+','+options.latLng.lng;
    if( options.fields ){
        params.fields = options.fields.join(',');
    }
    params.limit = options.limit || 25;
    
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
    
    if( !options || !options.place_id || !options.coordinates ){
        callback(new Error(
            'FacebookService::checkin requires place_id and coordinates as options'
        ));
    }
    
    var params = {
        place_id        :options.place_id,
        coordinates     :options.latLng.lat+','+options.latLng.lng
    };
    if( options.message ){
        params.message = options.message;
    }
    
    facebook.graph('/me/checkins',{
        user: user,
        params: params,
        method:'post'
    },function(result){
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
 * @param {String/Number}   place_id        Id of the place within the service
 * @param {Array}           fields          Fields to be returned
 * @param {Function}        callback        Callback Function
 *
 * @return {null}
 */
$.place = function(place_id, fields, callback){};