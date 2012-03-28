var _t = Bozuko.t,
    facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    merge = require('connect').utils.merge,
    Schema = mongoose.Schema,
    Services = require('./plugins/services'),
    Coords = require('./plugins/coords'),
    Geo = Bozuko.require('util/geo'),
    DateUtil = Bozuko.require('util/date'),
    XRegExp = Bozuko.require('util/xregexp'),
    ObjectId = Schema.ObjectId,
    indexOf = Bozuko.require('util/functions').indexOf,
    httpsUrl = Bozuko.require('util/functions').httpsUrl,
    async = require('async'),
	MailChimpApi = Bozuko.require('util/mailchimp').Api,
	ConstantContactApi = Bozuko.require('util/constantcontact').Api,
    inspect = require('util').inspect,
    rand = Bozuko.require('util/math').rand,
    Profiler = Bozuko.require('util/profiler'),
    codify = require('codify')
;

var Page = module.exports = new Schema({
    children            :[ObjectId],
	is_enterprise		:{type:Boolean, default: false},
    category            :{type:String, index: true},
	alias				:{type:String, index: true},
    website             :{type:String},
	nobranding			:{type:Boolean},
    phone               :{type:String},
    description         :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String, index: true},
    image               :{type:String, get: httpsUrl},
    use_twitter         :{type:Boolean, default: false},
    twitter_id          :{type:String},
    announcement        :{type:String},
    security_img        :{type:String},
    featured            :{type:Schema.Types.Mixed, index: true},
    test                :{type:Boolean, index: true, default: false},
    active              :{type:Boolean, default: false, index: true},
    location            :{
        lat	            :Number,
        lng	            :Number,
        street              :String,
        city                :String,
        state               :String,
        zip                 :String,
        country             :String
    },
    
	/* deprecate */
    owner_id            :{type:ObjectId, index: true},
    admins              :[ObjectId],
    beta_agreement      :{
        signed              :{type:Boolean, default: false},
        signed_by           :{type:ObjectId},
        signed_date         :{type:Date}
    },
    
	// code_block is a running total. Can't just search because contests may be deleted.
    code_block          :{type:Number},
    code_prefix         :{type:String},
    pin                 :{type:String, index: true},
	
	// email services settings
	mailchimp_token		:{type:String},
	mailchimp_dc		:{type:String},
	mailchimp_endpoint	:{type:String},
	mailchimp_lists		:{type:Array},
	mailchimp_activelists	:{type:Array},
	
	constantcontact_token	:{type:String},
	constantcontact_username:{type:String},
	constantcontact_lists	:{type:Array},
	constantcontact_activelists	:{type:Array}
	
}, {safe: {j:true}});

Page.index({admins: 1});

Page.plugin(Services);
Page.plugin(Coords);

Page.pre('save', function(next) {
    var self = this;
    if (!this.pin) return Bozuko.models.Page.getPin(function(err, pin) {
        if (err) return next(err);
        self.pin = pin;
        return next();
    });
    return next();
});

Page.static('verifyPin', function(pin, callback) {
	pin = (pin || "").toUpperCase();
    return Bozuko.models.Page.findOne({pin: pin}, {_id: 1, name: 1}, function(err, page) {
        if (err) return callback(err);
        if (!page) return callback(Bozuko.error('page/invalid_pin'));
        return callback(null, page);
    });
});

var maxPin = Math.pow(36, 6);
var minPin = Math.pow(36, 4);
Page.static('getPin', function(callback) {
    var self = this;
    var found = false;
    var pin = null;
    return async.until(
        function() {return found;},
        function(cb) {
            var random = rand(minPin, maxPin);
            pin = codify.toCode(random);
            return Bozuko.models.Page.findOne({pin: pin}, function(err, page) {
                if (err) return cb(err);
                if (!page) found = true;
                return cb();
            });
        }, function(err) {
            if (err) return callback(err);
            return callback(null, pin);
        }
    );
});

Page.method('getWebsite', function(){
    var website = this.website;
    website = website.replace(/^\s+/, '').replace(/\s.*/, '');
    if( !website.length ) return '';
    if( !website.match(/^http/) ) website = 'http://'+website;
    return website;
});

Page.method('setCodeBlock', function(callback) {
        var page_id = this._id;
        return Bozuko.models.Contest.count({page_id: page_id}, function(err, count) {
            if (err) return callback(err);
            count = count || 0;
            return Bozuko.models.Page.update({_id: page_id}, {$set: {code_block: count}}, function(err) {
                return callback(null, count);
            });
        });
});

Page.static('setCodeInfo', function(page_id, callback) {
    return Bozuko.models.Page.findById(page_id, function(err, page) {
        if (err) return callback(err);
        if (!page) return callback(Bozuko.error('page/does_not_exist'));
        if (!page.code_block && page.code_block !== 0) return page.setCodeBlock(function(err) {
            if (err) return callback(err);
            if (page.code_prefix) return callback(null);
            return page.setCodePrefix(callback);
        });
        return Bozuko.models.Page.update({_id: page_id}, {$inc: {code_block: 1}}, function(err) {
            if (err) return callback(err);
            if (page.code_prefix) return callback(null);
            return page.setCodePrefix(callback);
        });
    });
});

Page.method('setCodePrefix', function(callback) {
    var page_id = this._id;
    return Bozuko.models.CodePrefix.increment(function(err, prefix) {
        if (err) return callback(err);
        return Bozuko.models.Page.update({_id: page_id}, {$set: {code_prefix: prefix}}, callback);
    });
});

Page.static('getCodeInfo', function(page_id, callback) {
    if (!page_id) return callback(Bozuko.error('page/does_not_exist'));
    return Bozuko.models.Page.findById(page_id, function(err, page) {
        if (err) return callback(err);
        if (!page) return callback(Bozuko.error('page/does_not_exist'));
        if (page.code_block && page.code_prefix) return callback(null, page.code_block, page.code_prefix);
        return Bozuko.models.Page.setCodeInfo(page_id, callback);
    });
});

Page.method('getMailChimpApi', function(){
	if( !this.mailchimp_token ) return false;
	return new MailChimpApi( this.mailchimp_token, this.mailchimp_dc, this.mailchimp_endpoint );
});

Page.method('getConstantContactApi', function(){
	if( !this.constantcontact_token ) return false;
	return new ConstantContactApi( this.constantcontact_token, this.constantcontact_username );
});

Page.method('isAdmin', function(user, callback){
    callback( null, ~this.admins.indexOf(user._id) );
});

Page.method('addAdmin', function(user, callback){
    var page = this;
    async.parallel([
        function add_page_admin(cb){
            if( !~indexOf( page.admins, user._id ) ){
                page.admins.push( user._id );
                return page.save(cb);
            }
            return cb();
        },
        function add_user_manages(cb){
            if( !~indexOf( user.manages, page._id ) ){
                user.manages.push( page._id );
                return user.save(cb);
            }
            return cb();
        }
    ], function(error){
        callback();
    });
});

Page.method('removeAdmin', function(user, callback){
    var page = this;
    async.parallel([
        function remove_page_admin(cb){
            var i;
            if( ~indexOf( page.admins, user._id ) ){
                var admins = [];
                page.admins.forEach(function(id){
                    if( String(id) != String(user._id) ){
                        admins.push(id);
                    }
                });
                page.admins = admins;
                return page.save(cb);
            }
            return cb();
        },
        function remove_user_manages(cb){
            var i;
            if( ~indexOf( user.manages, page._id ) ){
                var manages = [];
                user.manages.forEach(function(id){
                    if( String(id) != String(page._id) ){
                        manages.push(id);
                    }
                });
                user.manages = manages;
                return user.save(cb);
            }
            return cb();
        }
    ], function(error){
        callback();
    });
});

Page.method('getContests', function(callback){
    Bozuko.models.Contest.find({page_id:this.id}, callback);
});

Page.method('getGoogleMapLink', function(){
    var url = "http://maps.google.com/maps?q="
            + encodeURIComponent([this.name,this.location.street,this.location.city,this.location.state].join(', '))
            + '&ll='+this.coords[1]+','+this.coords[0];

    return url;
});

Page.method('loadContests', function(user, callback){
    var self = this;
    var now = new Date();
    if (!this.contests) this.contests = [];

    return Bozuko.models.Contest.find({
        active: true,
		web_only: {$ne: true},
		$or: [{page_id: this._id}, {page_ids: this._id}],
		start: {$lt: now},
        end: {$gt: now}
    }, {results: 0, plays: 0},
    function(err, contests) {
		if( err){
			return callback(err);
		}
        // attach active contests to page
        return async.forEach(contests, function (contest, cb) {
            // load contest game state
            var opts = {user: user, page: self};
            return contest.loadGameState(opts, function(error, state){
                if (error) return cb(error);
				if (!state.game_over) self.contests.push(contest);
                return cb(null);
            });
        }, function(err) {
            return callback(err, self.contests);
        });
    });
});

Page.method('canUserCheckin', function(user, callback){

    var self = this;

    // During load tests always allow the checkin
    if (Bozuko.config.test_mode && Bozuko.env() == 'development') return callback(null, true);

    var page_thresh = Date.now() - Bozuko.cfg('checkin.duration.page', DateUtil.HOUR * 4 ),
        user_thresh = Date.now() - Bozuko.cfg('checkin.duration.user', DateUtil.MINUTE * 15 ),
        travel_thresh = Date.now() - Bozuko.cfg('checkin.travel.reset', DateUtil.HOUR * 10 )
        ;

    Bozuko.models.Checkin.find(
        // get the last checkin...
        {
            user_id: user._id,
            timestamp: {$gt: new Date(travel_thresh)}
        }, {}, {sort: {timestamp: -1}},
        function(error, checkins){
            // lets look at the last checkin
            if( error ) return callback( error );
            if( !checkins || !checkins.length ) return callback( null, true );

            for( var i=0; i<checkins.length; i++){

                var checkin = checkins[i];

                var samePage = String(checkin.page_id) === String(self._id);

                if( samePage && +checkin.timestamp > page_thresh ){
                    return self.getNextCheckinTime( user, function(error, next_time){
                        if( error ) return callback(error);
                        return callback( null, false, checkin, Bozuko.error('checkin/too_many_attempts_per_page', {next_time: next_time}) );
                    });
                }

                if( +checkin.timestamp > user_thresh ){
                    return self.getNextCheckinTime( user, function(error, next_time){
                        if( error ) return callback(error);
                        return callback( null, false, checkin, Bozuko.error('checkin/too_many_attempts_per_user', {next_time: next_time}) );
                    });
                }

                // okay, distance over time check
                // if its the samePage, they haven't gone anywhere.
                // or if the travel check reset duration has passed, forget it.
                if( samePage || +checkin.timestamp < travel_thresh ){
                    return callback( null, true );
                }

                // get time they could have started moving...
                var start = +checkin.timestamp +Bozuko.cfg('checkin.duration.user', DateUtil.MINUTE * 15 );


                var hours = (Date.now()-start) / DateUtil.HOUR,
                    // allowed distance in miles
                    allowed_distance = hours * Bozuko.cfg('checkin.travel.speed', 60),
                    // total distance between places
                    distance = Geo.distance(self.coords, checkin.coords, 'mi');
                    ;

                if( distance > allowed_distance ){
                    // how much longer?
                    var time = (distance / Bozuko.cfg('checkin.travel.speed', 60)) * DateUtil.HOUR;
                    console.error('User can check in here '+DateUtil.inAgo( new Date(+start+time)) );

                    return callback( null, false, checkin, Bozuko.error('checkin/too_far_too_soon') );
                }
            }

            return callback( null, true );
        }
    );
});

Page.method('getNextCheckinTime', function(user, callback){

    var self = this;
    var now = new Date();

    var page_last_allowed_checkin = new Date();
    var user_last_allowed_checkin = new Date();

    page_last_allowed_checkin.setTime(now.getTime()-Bozuko.config.checkin.duration.page);
    user_last_allowed_checkin.setTime(now.getTime()-Bozuko.config.checkin.duration.user);

    Bozuko.models.Checkin.find(
        {
            $or: [{
                user_id: user._id,
                page_id: self._id,
                timestamp: {$gt: page_last_allowed_checkin}
            },{
                user_id: user._id,
                timestamp: {$gt: user_last_allowed_checkin}
            }]

        },{},{sort: {timestamp: -1}},
        function(error, checkins){
            // lets look at the last checkin
            if( error ) return callback( error );
            if( !checkins.length ) return callback(null, new Date() );

            var nextTime = Date.now();

            checkins.forEach(function(checkin){
                var time;
                if( String(checkin.page_id) != String(self._id) ){
                    time = +checkin.timestamp+Bozuko.config.checkin.duration.user;
                }
                else{
                    time = +checkin.timestamp+Bozuko.config.checkin.duration.page;
                }
                nextTime = Math.max(nextTime, time);
            });
            return callback( null, new Date(nextTime) );
        }
    );
});

Page.method('checkin', function(user, options, callback) {
    var self = this;

    this.canUserCheckin( user, function(error, canCheckin, checkin, checkinError){

        // lets look at the last checkin
        if( error ) return callback( error );

        if( checkin && checkinError ){
            return callback( checkinError );
        }
        Bozuko.publish('page/checkin', {
            page_name: self.name,
            user_name: user.name,
            accuracy: options.accuracy,
            ll: options.ll,
            distance: options.ll && options.ll.length == 2 && options.coords && self.coords.length == 2 ? Geo.distance( options.ll, self.coords, 'mi' ) : null
        });

        options.user = user;
        if( self.service('facebook') ){
            options.link = self.service('facebook').data.link;
        }
        options.picture = 'https://'+Bozuko.config.server.host+':'+Bozuko.config.server.port+'/page/'+self.id+'/image';
        var contest = options.contest;

        if(!contest) {
            // lets set a generic checkin message
            options.name = _t(user.lang, 'checkin/general_checkin_name');
            options.description = _t(
                user.lang,
                'checkin/general_checkin_desc'
            );
        } else {
            // customize message for the contest
            var game = contest.getGame();
            var best_prize = contest.getBestPrize();
            // There should always be a best prize in reality. Sometimes in tests we don't have any prizes.
            best_prize = best_prize ? best_prize.name : 'no prize';
            options.name = _t(user.lang, 'checkin/contest_checkin_name', self.name);
            options.description = _t(
                user.lang,
                'checkin/contest_checkin_desc',
                user.name,
                self.name,
                best_prize,
                game.name
            );
        }

        options.page = self;
        options.user = user;

        return Bozuko.models.Checkin.process(options, function(error, checkin){
            if( error ) return callback( error );
            return callback( null, checkin);
        });
    });
});

Page.static('createFromServiceObject', function(place, callback){
    var ignore = ['id','service','lat','lng','data'];

    var page = new Bozuko.models.Page();
    Object.keys(place).forEach(function(prop){
        if( !~ignore.indexOf(prop) ){
            page.set(prop, place[prop]);
        }
    });

    page.set('is_location', true);
    page.set('coords',[place.location.lng, place.location.lat]);
    page.service( place.service, place.id, null, place.data);
    page.save( function(error){
        return error ? callback( error ) : callback( null, page);
    });
});

Page.static('loadPagesContests', function(pages, user, callback){
    var now = new Date();
    var user_id = user ? user._id : false;

    async.forEach(pages, function(page, cb) {
        page.loadContests(user, cb);
    }, function(err) {
	if (err) return callback(err);
	return callback(null, pages);
    });
});

Page.static('geoNear', function(opts, callback) {
    var cmd = {geoNear: 'pages'};
    merge(cmd, opts);
    Bozuko.db.conn().connection.db.executeDbCommand(cmd, function(err, result) {
        if (err) return callback(err);
        var doc = result.documents[0];
        if (!doc.ok) return callback(doc);

        var pages = [];
        return async.forEach(doc.results, function(page, cb) {
            var model = new Bozuko.models.Page();
            model.init(page.obj, function(err) {
                if (err) return cb(err);
                model.distance = page.dis;
                pages.push(model);
                return cb(null);
            });
        }, function(err) {
            callback(null, pages);
        });
    });
});

function filterFeaturedByDistance(pages) {
    var featured = [];
    pages.forEach(function(page) {
        var distance = Geo.earth.radius.mi * page.distance;
        if (distance <= page.featured.max_distance) {
            featured.push(page);
        }
    });
    return featured;
}

function chooseRandomFeaturedPages(num, featured) {
    var selected = [];
    if (num >= featured.length) return featured;
    for (var i = 0; i < num; i++) {
        index = rand(0, featured.length-1);
        selected = selected.concat(featured.splice(index, 1));
    }
    return selected;
}

Page.static('getFeaturedPages', function(num, ll, callback){
    if( !num ) return callback( null, [] );

    var distance =  Bozuko.config.search.featuredRadius/ Geo.earth.radius.mi;

    return Bozuko.models.Page.find(
        // Find nationally featured places
        {$or : [
             {'featured.is_featured':true, 'featured.max_distance': -1},
             {'featured': true}
         ]},
        {results: 0, plays: 0},
        function(error, nationalPages){
            if( error ) return callback( error );

            // Find featured places within max distance of ll
            return Bozuko.models.Page.geoNear({
                near: ll,
                maxDistance: distance,
                spherical:true,
                query: {'featured.is_featured':true}
            }, function(err, pages) {
                var localPages = filterFeaturedByDistance(pages);
                var featured = localPages.concat(nationalPages);
                var selected = chooseRandomFeaturedPages(num, featured);
                callback(err, selected);
            });
        }
    );
});

/**
 * Big honkin search function that does all the page searches
 * including a search (by location - center), "favorites" (by location - center),
 *
 */
Page.static('search', function(options, callback){

    var getFeatured = false,
        hideFeaturedPastThreshold = options.hideFeaturedPastThreshold || false,
        limit = options.limit || 25,
        offset = options.offset || 0,
        page = Math.floor(offset / limit)
        ;

    var bozukoSearch = {
        type:'find',
        selector:{active: true},
        fields: {},
        // sorting asc puts true first
        options:{limit: Bozuko.config.search.nearbyLimit, skip: Bozuko.config.search.nearbyLimit * page}
    };

    var serviceSearch = {};
    if( options.query ){
        bozukoSearch.selector.name = new RegExp('(^|\\s)'+XRegExp.escape(options.query), "i");
    }

    if( options.sort ){
        bozukoSearch.options.sort = options.sort;
    }

    // are we looking for favorites?
    if( options.favorites ){
        if( !options.user ){
            return callback(Bozuko.error('bozuko/user_not_logged_in', 'Getting Favorites'));
        }
        var user = options.user;
        bozukoSearch.selector._id = {$in:user.favorites||[]};
        bozukoSearch.selector.coords = {$nearSphere: options.ll};
        bozukoSearch.limit = 25;

        serviceSearch = false;
    }
    // are we looking for bounded results
    else if( options.bounds ){

        bozukoSearch.selector.active = true;
        bozukoSearch.selector.coords = {$within: {$box: options.bounds}};

        bozukoSearch.type='nativeFind';

        /**
         * TODO
         *
         * Decide if we should also perform a service search
         *
         */
        serviceSearch = false;
    }
	
    /**
     * This is a standard center search, we will use a service to get
     * additional results, but also do a search
     *
     */
    else {
        if( !options.query && !page ) getFeatured = true;
        // we need to add featured results to the main search page
        if( Bozuko.config.test_mode && !options.query ){
            bozukoSearch.selector.test = true;
            bozukoSearch.selector['coords'] = {$near: options.ll};
        }
        else if( !page ){
            var distance = Bozuko.config.search.nearbyRadius / Geo.earth.radius.mi;
            bozukoSearch.selector.coords = {$nearSphere: options.ll, $maxDistance: distance};
            if( options.query ){
                delete bozukoSearch.selector.coords['$maxDistance'];
                /*
                var coords = bozukoSearch.selector.coords;
                delete bozukoSearch.selector.coords;
                bozukoSearch.selector.$or = [coords, {$exists: false}];
                */
            }
            bozukoSearch.options.limit = Bozuko.config.search.nearbyMin;
            bozukoSearch.type='nativeFind';
            // serviceSearch = false;
        }
    }

    // utility functions
    function prepare_pages(pages, user, fn){
        var prof = new Profiler('/models/page/search/prepare_pages');
        for(var i=0; i<pages.length; i++){
            var page = pages[i];

            if( options.user ){
                page.favorite = ~(options.user.favorites||[]).indexOf(page._id);
            }

            if( page._doc && page.contests && page.contests.length ){
                page.registered = true;
            }
            if (!page.active && page._id) {
                page.id = page.service('facebook').sid;
            }
            page._distance = Geo.distance( options.ll, page.coords );
            page.distance = Geo.formatDistance( Geo.distance(options.ll, page.coords), page.coords);
            if(fn) fn.call(this, page);
        }
        prof.stop();
    }

    function return_pages(pages){
        var prof = new Profiler('/models/page/search/return_pages');
        var count = 0;
        if( hideFeaturedPastThreshold ){
            pages.forEach(function(page){
                if( page.featured && (!getFeatured || ++count > Bozuko.config.search.featuredResults )){
                    page.featured = false;
                }
            });
        }

        if( !options.favorites && options.user && options.user.manages && options.user.manages.length ){
            var selector = {
                name: 'Admin Demo',
                _id: {$in: options.user.manages}
            };
            return Bozuko.models.Page.findOne( selector, function(error, page){
                if( !error && page ){
                    // have to load the contests
                    return page.loadContests(options.user, function(error){
                        pages.unshift(page);
                        page.registered = true;
                        prof.stop();
                        return callback( null, pages );
                    });
                }
                prof.stop();
                return callback( null, pages );
            });
        }
        prof.stop();
        return callback( null, pages );
    }

    return Bozuko.models.Page.getFeaturedPages(getFeatured ? Bozuko.cfg('search.featuredResults',1) : 0, options.ll, function(error, featured){

        if( error ) return callback(error);
        var featured_ids = [];


        if( featured.length ){
            featured.forEach(function(feature){ featured_ids.push( feature._id ); });
            bozukoSearch.selector._id = {
                $nin: featured_ids
            };
        }
        
        return Bozuko.models.Page[bozukoSearch.type](bozukoSearch.selector, bozukoSearch.fields, bozukoSearch.options, function(error, pages){
            
			if( error ) return callback(error);

            pages = featured.concat(pages);

            return Bozuko.models.Page.loadPagesContests(pages, options.user, function(error, pages){
                if( error ) return callback(error);
				
				// lets ditch any pages that have no contests.
				var i=0, removed_ids = [];
				while( i<pages.length && pages.length ){
					if(!pages[i].contests || !pages[i].contests.length){
						removed_ids.push(String(pages[i]._id));
						pages.splice(i,1);
					}
					else{
						i++;
					}
				}

                var page_ids = [], fb_ids=[];
                prepare_pages(pages, options.user, function(page){
                    var fb;
                    if( (fb = page.service('facebook')) ){
                        fb_ids.push(String(fb.sid));
                    }
                    page_ids.push(page._id);
                    if( !~featured_ids.indexOf( page._id ) ) page.featured = false;
                });
				
				page_ids = page_ids.concat(removed_ids);


                if( !serviceSearch ){
					pages.sort( sort_by('_distance') );
                    pages.sort( 'featured' );
                    return return_pages( pages );
                }

                options.center=options.ll;

                // use a 3rd party service to get additional results
                // and then match against our db
                var service = options.service || Bozuko.config.defaultService;

                return Bozuko.service(service).search(options, function(error, _results){
					
					if( error ){
                        console.error( error );
                        pages.sort( sort_by('_distance') );
                        return return_pages( pages );
                        // return callback(error);
                    }

                    var prof = new Profiler('/models/page/search/build_results');
                    var map = {}, results = [];

                    if( _results ) _results.forEach( function(place, index){
                        if( ~fb_ids.indexOf(String(place.id)) ) return;
                        results.push(place);
                        map[String(place.id)] = place;
                    });
                    prof.stop();

                    return Bozuko.models.Page.findByService(service, Object.keys(map), {
                        active: true,
                        _id: {$nin: page_ids}
                    }, function(error, _pages){
                        if( error ) return callback( error );

                        prepare_pages(_pages, options.user, function(page){
                            if( !~featured_ids.indexOf( page._id ) ) page.featured = false;
                            results.splice( results.indexOf(map[page.service(service).sid]), 1 );
                        });

                        if (results) {
                            var prof = new Profiler('/models/page/search/geoformat_results');
                            results.forEach(function(result){
                                result.registered = false;
                                result._distance = Geo.distance(options.ll, [result.location.lng,result.location.lat]);
                                result.distance = Geo.formatDistance( Geo.distance(options.ll, [result.location.lng,result.location.lat]), [result.location.lng,result.location.lat] );
                            });
                            prof.stop();
                        }

                        return Bozuko.models.Page.loadPagesContests(_pages, options.user, function(error, _pages){

                            if( error ) return callback( error );

                            var prof = new Profiler('/models/page/search/loadPagesContests');
                            pages = pages.concat(_pages);

                            pages.sort( function(a,b){
                                if( a.featured && !b.featured ) return -1;
                                if( b.featured && !a.featured ) return 1;
                                return sort_by('_distance')(a,b);
                            });
                            results.sort( sort_by('_distance') );

                            pages = pages.concat(results);

                            prof.stop();

                            return return_pages(pages);
                        });
                    });
                });
            });
        });
    });
});

function sort_by(field, dir){
    return function(a,b){
        switch( typeof a[field]){
            case 'number':
                return (a[field] - b[field]) * (!!dir ? -1 : 1);
            case 'boolean':
                var ax = a[field] ? 0 : 1, bx = b[field] ? 0 : 1;
                return (ax - bx) * (!!dir ? -1 : 1);
        }
        return (a[field] - b[field]) * (!!dir ? -1 : 1);
    };
}
