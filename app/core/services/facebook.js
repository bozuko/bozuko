var URL         = require('url'),
    http        = Bozuko.require('util/http'),
    merge       = require('connect').utils.merge,
    inspect     = require('util').inspect,
    qs          = require('querystring'),
    url         = require('url'),
    facebook    = Bozuko.require('util/facebook'),
    Service     = Bozuko.require('core/service'),
    Geo         = Bozuko.require('util/geo')
;

var FacebookService = module.exports = function(){
    Service.apply(this,arguments);
};

FacebookService.prototype.__proto__ = Service.prototype;

var api = facebook.graph;

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
FacebookService.prototype.login = function(req,res,scope,defaultReturn,success,failure){
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
        'redirect_uri' : protocol+'//'+Bozuko.config.server.host+':'+
                         Bozuko.config.server.port+url.pathname+
                         ((url.search||'').replace(/[&\?]code=.*$/i, ''))
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
        var url = 'https://www.facebook.com/dialog/oauth?'+qs.stringify(params);
        return res.redirect(url);
    }
    else if( error_reason ){
        /**
         * User did not allow permissions...
         */
        var ret = req.session.redirect || defaultReturn || '/';
        ret+= (ret.indexOf('?') != -1 ? '&' : '?')+'error_reason='+error_reason;

        console.error( error_reason );

        if( failure ){
            if( failure(Bozuko.error('facebook/permissions_denied'), req, res) === false ){
                return null;
            }
        }

        return res.redirect(ret);
    }
    else{
        params.client_secret = Bozuko.config.facebook.app.secret;
        params.code = code;

        // we should also have the user information here...
        var ret = req.session.redirect || defaultReturn;

        return http.request({
            url: 'https://graph.facebook.com/oauth/access_token',
            params: params},
            function(err, response){

                if (err) {
                    if( failure && failure(err, req, res) === false){
                        return false;
                    }
                    return err.send(res);
                }

                var result = qs.parse(response);
                if( result['access_token'] ) {
                    // grab the access token
                    var token = result['access_token'];

                    // lets get the user details now...
                    return facebook.graph('/me', {
                        params:{
                            access_token : token
                        }
                    }, function(error, user){
                        if( error ){
                            if( failure && failure(error, req, res) === false){
                                return false;
                            }
                            return error.send(res);
                        }
                        user = self.sanitizeUser(user);
                        user.token = token;
                        return Bozuko.models.User.addOrModify(user, req.session.phone, function(err, u) {
                            if (err) {
                                console.log("Facebook login error: "+err);
                                return err.send(res);
                            }

                            return u.updateInternals( true, function(error){
                                if (error && failure) {
                                    if( failure(Bozuko.error('user/blocked'), req, res) === false ){
                                        return null;
                                    }
                                }

                                req.session.userJustLoggedIn = true;
                                req.session.user = u;

                                if( success ){
                                    if( success(u,req,res) === false ){
                                        return null;
                                    }
                                }
                                return res.redirect((ret || '/user')+'?token='+req.session.user.token);
                            });
                        });
                    });
                } else {
                    if( failure ){
                        if( failure(Bozuko.error('facebook/permissions_denied'), req, res) === false ){
                            return null;
                        }
                    }
                    return res.send("<html><h1>Facebook authentication failed :( </h1></html>");
                }
            }
        );
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
FacebookService.prototype.search = function(options, callback){
    var self = this;
    if( !options || !(options.center || options.query) ){
        return callback(Bozuko.error('facebook/no_lat_lng_query'));
    }

    var params = {
        type : options.center ? 'place' : 'page'
    };
	
    if( options.center ){
		params.center = options.center[1]+','+options.center[0];
		params.distance = options.distance || 10000;
	}
    if( options.query ) params.q = options.query;
    if( !options.fields ) {
        options.fields = ['link','name','category','checkins','location','website','phone'];
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
        function facebook_search(error, results){
            if( error ) return callback( error );
            // these need to be mapped to
            // generic Bozuko.objects
			return callback(null, self.sanitizePlaces(results.data));
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
FacebookService.prototype.checkin = function(options, callback){

    if( !options || !options.place_id || !options.ll || !options.user ){
        return callback(Bozuko.error('facebook/no_lat_lng_user_place'));
    }

    var params = {
        place           :options.place_id,
        coordinates     :JSON.stringify({latitude:options.ll[1],longitude: options.ll[0]})
    };

    if( options.name )          params.name         = options.name;
    if( options.message )       params.message      = options.message;
    if( options.picture )       params.picture      = options.picture;
    if( options.link )          params.link         = options.link;
    if( options.description )   params.description  = options.description;
    if( options.actions )       params.actions      = JSON.stringify(options.actions);

    if( Bozuko.config.test_mode ){
        return callback(null, {id:134574646614657});
    }

    return facebook.graph('/'+options.place_id,{
        user: options.user,
        params: {fields:'location,name'}
    },function(error, result){
        if( error ) return callback( error );

        if( !result || !result.location ) return callback( Bozuko.error('checkin/non_location') );
        coords = [result.location.longitude, result.location.latitude];
        var d = Geo.distance( options.ll, coords, 'mi' );
	
	/*
	var accuracy = options.accuracy*1.20; // add a fudge factor of 20% to reduce false positives
        if (1 || accuracy < 50) accuracy = 50;
	var radius = accuracy*3.3 || Bozuko.cfg('checkin.distance', 600);
	*/
	var accuracy = options.accuracy*1.20;
	var radius = Bozuko.cfg('checkin.distance', 600);
	radius = radius / 5280;
	// if (radius > 1) radius = 1;
	if (Bozuko.env() !== 'development' && Bozuko.env() !== 'playground') {
	    if (Bozuko.env() === 'api') {
		// Would the user be rejected by our accuracy algorithm? If so log it for analytics.
		if (radius && d > radius) {
		    var badCheckin = new Bozuko.models.BadCheckin({
			user_id: options.user._id,
			fb_place_id: options.place_id,
			place: result.name,
			timestamp: new Date(),
			ll: options.ll,
			distance: d,
			accuracy: accuracy,
			radius: radius
		    });
		    Bozuko.publish('checkin/bad', {place: result.name, user: options.user, accuracy: accuracy});
		    // no need for this to be in the performance path
		    badCheckin.save(function(err) {
			if (err) console.error('Error saving badCheckin: '+err);
		    });
		}
	    }
	    radius = Bozuko.cfg('checkin.distance', 600) / 5280;
	}
	console.log('accuracy = '+accuracy);
	console.log("d = "+d);
	console.log("radius = "+radius);

        if( d > radius ){
            // too far...
            console.error(
                "\n\n********Too Far Away Error*********\n"+
                "User is "+(Geo.formatDistance(d))+' away\n'+
                "Name: "+options.user.name+"\n"+
                "Place: "+result.name+"\n"+
                "Facebook ID "+options.place_id+"\n"+
                "User Coords: "+options.ll.slice().reverse().join(',')+"\n"+
                "Place Coords: "+coords.slice().reverse().join(',')+"\n"
            );
            return callback( Bozuko.error('checkin/too_far', {user: options.user}) );
        }
        return facebook.graph('/me/checkins',{
            user: options.user,
            params: params,
            method:'post'
        },function(error, result){
            // check the result..
            if( error ){
                if( /too far away/.test(error.message) ){
                    return callback( Bozuko.error('checkin/too_far') );
                }
                return callback( error );
            }
            return callback(null, result);
        });

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
FacebookService.prototype.user = function(options, callback){

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
    },function(error, result){
        if( error ) return callback( error );
        return callback(null, self.sanitizeUser(result));
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
FacebookService.prototype.user_favorites = function(options, callback){
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
FacebookService.prototype.like = function(options, callback){

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
    },function(error, result){
        if( error ) return callback( error );
        return callback(null, result);
    });
};

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
 *
 * @return {null}
 */
FacebookService.prototype.post = function(options, callback){
    if( !options || !options.user || !options.user.service('facebook') ){
        return callback(Bozuko.error('facebook/no_page_id_user'));
    }
    var params = {};

    if( options.message )       params.message      = options.message;
    if( options.picture )       params.picture      = options.picture;
    if( options.link )          params.link         = options.link;
    if( options.name )          params.name         = options.name;
    if( options.caption )       params.caption      = options.caption;
    if( options.description )   params.description  = options.description;
    if( options.actions )       params.actions      = JSON.stringify(options.actions);

    if( options.test || Bozuko.cfg('test_mode', true) ){
        return callback(null, {result:123123123});
    }
	
	// console.log(params);

    return facebook.graph('/feed',{
        user: options.user,
        params: params,
        method:'post'
    },function(error, result){
        if( error ) return callback( error );
        return callback(null, result);
    });
}

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
FacebookService.prototype.place = function(options, callback){
    var self = this
	  , id
	  ;
	
	if(options instanceof String || options instanceof Number){
		options = {id:options};
	}
    if( !options || !(options.id || options.place_id) ){
        return callback(Bozuko.error('facebook/no_page_id'));
    }

    var params = {};
    if( options.fields && options.fields instanceof Array){
        params.fields = options.fields.join(',');
    }
    if( options.access_token ){
        params.access_token = options.access_token;
    }
    facebook.graph('/'+(options.id||options.place_id), {
        params: params
    },function(error, result){
		if( error ) return callback( error );
		return callback(null, self.sanitizePlace(result) );
    });

};
FacebookService.prototype.place;

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

FacebookService.prototype.get_user_pages = function(user, callback){
    var self = this;
    facebook.graph('/me/accounts',
        {
            user: user,
            params:{
                fields:['id','name','category','likes','location','website','phone'].join(',')
            }
        },
        function(error, accounts){
            if( error ) return callback( error );

            var pages = [];
            var ids = [];
            if( accounts && accounts.data ) accounts.data.forEach(function(account){
                delete account.access_token;
                account = self.sanitizePlace(account);
                if( account.location && account.location.lat ){
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
                return Bozuko.models.Page.find({'services.name':'facebook','services.sid':{$in:ids}}, function(err, bozuko_pages){
                    if( err ) return callback( err );
                    if( bozuko_pages != null ) bozuko_pages.forEach(function(bozuko_page){
                        var i = ids.indexOf(bozuko_page.service('facebook').sid);
                        pages[i].has_owner = true;
                        pages[i].is_owner = (bozuko_page.owner_id == user._id);
                    });
                    return callback(null, pages);
                });
            }
            else{
                return callback(null, pages);
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
FacebookService.prototype._sanitizePlace = function(place){
    if( !place ) return null;
    if( !place.location ) place.location = {};
    return {
        service: 'facebook',
        id: place.id,
        checkins: place.checkins||0,
        likes: place.likes,
		link: place.link,
        website: place.website,
        phone: place.phone,
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
FacebookService.prototype._sanitizeUser = function(user){

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
