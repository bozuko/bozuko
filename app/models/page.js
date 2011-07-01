var _t = Bozuko.t,
    facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    merge = require('connect').utils.merge,
    Schema = mongoose.Schema,
    Services = require('./plugins/services'),
    Coords = require('./plugins/coords'),
    Geo = Bozuko.require('util/geo'),
    XRegExp = Bozuko.require('util/xregexp'),
    ObjectId = Schema.ObjectId,
    indexOf = Bozuko.require('util/functions').indexOf,
    async = require('async'),
    rand = Bozuko.require('util/math').rand,
    Profiler = Bozuko.require('util/profiler')
;

var Page = module.exports = new Schema({
    tree                :{type:String},
    category            :{type:String},
    website             :{type:String},
    phone               :{type:String},
    description         :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String},
    image               :{type:String},
    use_twitter         :{type:Boolean, default: false},
    twitter_id          :{type:String},
    announcement        :{type:String},
    security_img        :{type:String},
    featured            :{type:Boolean},
    test                :{type:Boolean, index: true, default: false},
    active              :{type:Boolean, default: true},
    location            :{
        street              :String,
        city                :String,
        state               :String,
        zip                 :String,
        country             :String
    },
    owner_id            :{type:ObjectId, index: true},
    admins              :[ObjectId],
    beta_agreement      :{
        signed              :{type:Boolean, default: false},
        signed_by           :{type:ObjectId},
        signed_date         :{type:Date}
    }
});

Page.index({admins: 1});

Page.plugin(Services);
Page.plugin(Coords);

Page.method('getOwner', function(callback){
    Bozuko.models.User.findById( this.owner_id, callback );
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
    })
});

Page.method('getContests', function(callback){
    Bozuko.models.Contest.find({page_id:this.id}, callback);
});

Page.method('loadContests', function(user, callback){
    var self = this;
    self.contests = [];
    this.getActiveContests(user, function(error, contests){
        if( error ) return callback( error );

        // else, we have contests!
        return async.forEach( contests,

            function load_contest(contest, cb){
                contest.loadGameState(user, function(error, state){
                    contest.loadEntryMethod(user, function(error, method){
                        self.contests.push(contest);
                        cb(null);
                    });
                });
            },

            function return_contests(error){
                return callback(error, self.contests);
            }
        );

    });
});

Page.method('getActiveContests', function(user, callback){
    var now = new Date();

    var min_expiry_date = new Date(now.getTime() - Bozuko.config.entry.token_expiration);
    var user_id = user ? user._id : false;

    var selector = {
        active: true,
        page_id: this._id,
        start: {$lt: now},
        end: {$gt: now}
    };

    Bozuko.models.Contest.nativeFind(selector, {results: 0, plays: 0}, {sort: {start: -1}}, function(err, contests) {
        if (err) return callback(err);
        
        
        var exhausted_contests = {};
        var exhausted_contest_ids = [];
        var contest;
        
        for (var i = 0; i < contests.length; i++) {
            contest = contests[i];
            
            
            // Is contest exhausted?
            if (contest.token_cursor >= contest.total_plays - contest.total_free_plays) {
                exhausted_contests[String(contest._id)] = contest;
                exhausted_contest_ids.push(contest._id);
                contests.splice(i, 1);
            }
        }
       
        if (!user_id) return callback(null, contests);

        // Find user entries that still have tokens for exhausted contests.
        // That means the contest is active for this user, but not users without tokens.
        // This is really only needed at the end of contests.
        if (exhausted_contest_ids.length) return Bozuko.models.Entry.nativeFind(
            {
                user_id: user_id,
                contest_id: {$in: exhausted_contest_ids},
                timestamp : {$gt: min_expiry_date},
                tokens : {$gt: 0}
            }, {contest_id: 1},
            function(err, entries) {
                if (err) return callback(err);
                if (!entries) return callback(null, contests);

                var contest_ids = {};

                // Add any exhausted contests with valid entries for this user back on the active list
                // There shouldn't be more than 1 or 2 entries to search
                for (var i = 0; i < entries.length; i++) {
                    var cid = entries[i].contest_id;
                    if (!contest_ids[cid]) {
                        contest_ids[cid] = true;
                        contests.push(exhausted_contests[String(cid)]);
                    }
                }
                
                return callback( null, contests);

            }
        );
        

        return callback(null, contests);
    });
});

Page.method('getUserGames', function(user, callback){
    this.getActiveContests( user, function(error, contests){
        if( error ) return callback(error);
        var games = [];
        return async.forEach( contests,

            function iterator(contest, cb){
                contest.loadTransferObject(user, function(error){
                    games.push(contest.getGame());
                    cb(null);
                });
            },

            function ret(error){
                return callback( error, games );
            }
        );

    });
});

Page.method('canUserCheckin', function(user, callback){

    var self = this;
    var now = new Date();

    var page_last_allowed_checkin = new Date();
    var user_last_allowed_checkin = new Date();
    /**
     * TODO - what about contest entry configs?
     *
     * However, this could get weird - what if they are on the business page
     * and want to checkin, should we allow that as long as they satisfy the global
     * page checkin duration, even if one contest checkin duration is longer? What
     * if there are two contests with different checkin durations?
     *
     */
    page_last_allowed_checkin.setTime(now.getTime()-Bozuko.config.checkin.duration.page);
    user_last_allowed_checkin.setTime(now.getTime()-Bozuko.config.checkin.duration.user);

    Bozuko.models.Checkin.findOne(
        {
            $or: [{
                user_id: user._id,
                page_id: self._id,
                timestamp: {$gt: page_last_allowed_checkin}
            },{
                user_id: user._id,
                timestamp: {$gt: user_last_allowed_checkin}
            }]

        },
        function(error, checkin){
            // lets look at the last checkin
            if( error ) return callback( error );

            if( checkin ){
                if( checkin.page_id == self._id ){
                    return callback( null, false, checkin, Bozuko.error('checkin/too_many_attempts_per_page') );
                }
                return callback( null, false, checkin, Bozuko.error('checkin/too_many_attempts_per_user') );
            }
            return callback( null, true );
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

        return self.getActiveContests(user, function(error, contests){
            if( error ) return callback(error);

            options.user = user;
            options.link = 'http://bozuko.com';
            options.picture = 'https://'+Bozuko.config.server.host+':'+Bozuko.config.server.port+'/page/'+self.id+'/image';

            // okay, lets try to give them entries on all open contests
            if( contests.length === 0 ){
                // lets set a generic checkin message
                options.name = _t(user.lang, 'checkin/general_checkin_name');
                options.description = _t(
                    user.lang,
                    'checkin/general_checkin_desc'
                );
            }
            else{
                var contest = contests[0];
                if( options.contest ){
                    if( options.contest.id ){
                        options.contest = options.contest.id;
                    }
                    // customize message for this specific contest
                    var found = false;
                    for(var i=0; i<contests.length && found==false; i++){

                        if( contests[i].id == options.contest ){
                            found = true;
                            contest = contests[i];
                        }
                    }
                }
                var game = contest.getGame();
                options.name = _t(user.lang, 'checkin/contest_checkin_name', self.name);
                options.description = _t(
                    user.lang,
                    'checkin/contest_checkin_desc',
                    user.name,
                    self.name,
                    contest.getBestPrize().name,
                    game.name
                );
            }

            // okay, we have everything we need to make a checkin, lets
            // do so with our checkin model

            options.page = self;
            options.user = user;

            return Bozuko.models.Checkin.process(options, function(error, checkin){
                if( error ) return callback( error );

                if( contests.length == 0 ){
                    return callback( null, {checkin:checkin, entries:[], contests: contests} );
                }
                var current = 0, entries = [];
                var count = 0;
                return async.forEach( contests,

                    function(contest, cb){
                        // check to make sure that the contest requires a checkin
                        var found = false;
                        contest.entry_config.forEach(function(entry_config){
                            if( entry_config.type == options.service+'/checkin' ){
                                found = true;
                            }
                        });
                        if( !found ){
                            return cb(null);
                        }
                        // try to enter the contest
                        var entry = Bozuko.entry(options.service+'/checkin', user, {
                            checkin: checkin
                        });
                        return contest.enter( entry, function(error, entry){
                            if( error ){
                                console.log('error entering contest');
                                return callback( error );
                            }
                            entries.push(entry);
                            return contest.loadGameState(user, cb);
                        });
                    },

                    function(error){
                        if( error ) return callback( error );
                        return callback( null, {checkin:checkin, entries:entries, contests:contests});
                    }
                );
            });

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
    var prof = new Profiler('/models/page/loadPagesContests/createPageMap');
    var page_map = {}, now = new Date();

    var min_expiry_date = new Date(now.getTime() - Bozuko.config.entry.token_expiration);
    var user_id = user ? user._id : false;

    var page_ids = [];
    pages.forEach(function(page){
        // page_ids can't be strings, so we can't just use Object.keys on the map
        page_ids.push(page._id);
        page_map[page._id+''] = page;
    });
    prof.stop();

    var selector = {
        active: true,
        page_id: {$in: page_ids},
        start: {$lt: now},
        end: {$gt: now}
    };

    Bozuko.models.Contest.nativeFind(selector, {results: 0, plays: 0}, function( error, contests ){

        var exhausted_contests = {};
        var exhausted_contest_ids = [];

        // attach active contests to pages
        return async.forEach(contests,
            function (contest, cb){
                var page = page_map[contest.page_id+''];
                if( !page.contests ){
                    page.contests = [];
                }

                // Is contest exhausted?
                if (contest.token_cursor >= contest.total_plays - contest.total_free_plays) {
                    exhausted_contests[String(contest._id)] = contest;
                    exhausted_contest_ids.push(contest._id);
                    return cb(null);
                }

                // load contest game state
                contest.loadGameState(user, function(error){
                    if (error) return cb(error);
                    contest.loadEntryMethod(user, function(error){
                        page.contests.push(contest);
                        cb(error);
                    });
                });
            },
            function (err){
                if (err) return callback(err);
                if (!user_id) return callback(null, pages);

                // Find user entries that still have tokens for exhausted contests.
                // That means the contest is active for this user, but not users without tokens.
                // This is really only needed at the end of contests.
                if (exhausted_contest_ids.length) return Bozuko.models.Entry.nativeFind(
                    {
                        user_id: user_id,
                        contest_id: {$in: exhausted_contest_ids},
                        timestamp : {$gt: min_expiry_date},
                        tokens : {$gt: 0}
                    }, {contest_id: 1},
                    function(err, entries) {
                        if (err) return callback(err);
                        if (!entries) return callback(null, pages);

                        var contest_ids = {};

                        var prof = new Profiler('/models/page/loadPagesContests/exhuasted_entries');
                        for (var i = 0; i < entries.length; i++) {
                            var cid = entries[i].contest_id;
                            if (!contest_ids[cid]) {
                                contest_ids[cid] = true;
                            }
                        }
                        prof.stop();

                        // Add any exhausted contests with valid entries for this user to the appropriate page
                        // There shouldn't be more than a handful of entries to search

                        var page, contest;
                        async.forEach(
                            Object.keys(contest_ids),
                            function(cid, cb) {
                                contest = exhausted_contests[String(cid)];
                                page = page_map[contest.page_id+''];
                                contest.loadGameState(user, function(error){
                                    if (error) return cb(error);
                                    contest.loadEntryMethod(user, function(error){
                                        if (error) return cb(error);
                                        page.contests.push(contest);
                                        cb(null);
                                    });
                                });
                            },
                            function(err) {
                                if (err) return callback(err);
                                return callback(null, pages);
                            }
                        );
                    }
                );

                return callback(null, pages);
            }
        );
    });
});

/**
 * Need to add our algorithm for finding featured items (by distance? how far is too far?)
 */
Page.static('getFeaturedPages', function(num, options, callback){

    if( !num ) return callback( null, [] );

    var find = {
        selector: {
            featured: true
        },
        options: {
            sort: { name: 1 }
        }
    };


    return Bozuko.models.Page.count(find.selector, function(error, count){
        if( error ) return callback( error );
        if( !count ) return callback( null, [] );

        var featured = [], pool=[], offsets=[], i;

        for(i=0; i<count; i++) pool.push(i);

        for(i=0; i<num && pool.length; i++){
            var index = rand(0, pool.length-1);
            offsets.push(
                pool.splice(index, 1)[0]
            );
        }

        return async.forEach(

            offsets,

            function iterator(offset, callback){
                var opts = merge({}, find);
                opts = merge(opts, {
                    options: {
                        sort: {'_id':1},
                        limit: 1,
                        skip: offset
                    }
                });

                return Bozuko.models.Page.find(opts.selector, {results: 0, plays: 0}, opts.options, function(error, page){
                    if( error ) return callback( error );
                    if( page && page.length) featured.push(page[0]);
                    return callback(null);
                });
            },

            function finish(error){
                if( error ) return callback(error);
                return callback(null, featured);
            }
        );
    });
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
        selector:{owner_id: {$exists: true}},
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

        serviceSearch = false;
    }
    // are we looking for bounded results
    else if( options.bounds ){

        bozukoSearch.selector.owner_id = {$exists:true};
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
            console.log(distance);
            bozukoSearch.selector.coords = {$nearSphere: options.ll, $maxDistance: distance};
            if( options.query ) delete bozukoSearch.selector.coords['$maxDistance'];
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
            if( page.doc ){
                page.registered = true;
            }
            if (!page.owner_id && page._id) {
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
        prof.stop();
        callback( null, pages );
    }

    return Bozuko.models.Page.getFeaturedPages(getFeatured ? Bozuko.cfg('search.featuredResults',1) : 0, options, function(error, featured){

        if( error ) return callback(error);
        var featured_ids = [];

        var prof = new Profiler('/models/page/search/build_featured_selector');
        if( featured.length ){
            featured.forEach(function(feature){ featured_ids.push( feature._id ); });
            bozukoSearch.selector._id = {
                $nin: featured_ids
            };
        }
        prof.stop();

        return Bozuko.models.Page[bozukoSearch.type](bozukoSearch.selector, bozukoSearch.fields, bozukoSearch.options, function(error, pages){

            if( error ) return callback(error);
            pages = featured.concat(pages);

            return Bozuko.models.Page.loadPagesContests(pages, options.user, function(error, pages){
                if( error ) return callback(error);

                var page_ids = [], fb_ids=[];
                prepare_pages(pages, options.user, function(page){
                    var fb;
                    if( (fb = page.service('facebook')) ){
                        fb_ids.push(String(fb.sid));
                    }
                    page_ids.push(page._id);
                    if( !~featured_ids.indexOf( page._id ) ) page.featured = false;
                });


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
                        owner_id: {
                            $exists: true
                        },
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

                            var prof = new Profiler('/models/page/search/loadPagesContests');
                            pages = pages.concat(_pages);

                            pages.sort( sort_by('_distance') );
                            pages.sort( sort_by('featured') );
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