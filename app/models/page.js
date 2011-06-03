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
    owner_id            :{type:ObjectId, index: true}
});

Page.plugin(Services);
Page.plugin(Coords);

Page.method('getOwner', function(callback){
    Bozuko.models.User.findById( this.owner_id, callback );
});

Page.method('getContests', function(callback){
    Bozuko.models.Contest.find({page_id:this.id}, callback);
});

Page.method('loadContests', function(user, callback){
    var self = this;
    self.contests = [];
    this.getActiveContests(function(error, contests){
        if( error ) return callback( error );

        // else, we have contests!
        return async.forEach( contests,

            function load_contest(contest, cb){
                contest.loadGameState(user, function(error, state){
                    contest.loadEntryMethod(user, function(error, method){
                        self.contests.push(contest);
                    });
                    cb(null);
                });
            },

            function return_contests(error){
                return callback(error, self.contests);
            }
        );

    });
});

Page.method('getActiveContests', function(callback){
    var prof = new Profiler('/models/page/getActiveContests');
    var now = new Date();
    var params = {
        page_id:this.id,
        active: true,
        start: {$lt: now},
        end: {$gt: now},
        $where: "this.token_cursor < this.total_plays;"
    };
    if( arguments.length == 2 ){
        callback = arguments[1];
    }
    Bozuko.models.Contest.find(params, function(err, contests) {
        prof.stop();
        callback(err, contests);
    });
});

Page.method('getUserGames', function(user, callback){
    this.getActiveContests( function(error, contests){
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

    var prof = new Profiler('/models/page/canUserCheckin');
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
            prof.stop();
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

        return self.getActiveContests(function(error, contests){
            if( error ) return callback(error);

            options.user = user;
            options.link = 'http://bozuko.com';
            //options.picture = 'http://bozuko.com/images/bozuko-chest-check.png';
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
                    return callback( null, {checkin:checkin, entries:[]} );
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
                            return cb(null);
                        });
                    },

                    function(error){
                        if( error ) return callback( error );
                        return callback( null, {checkin:checkin, entries:entries});
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
    pages.forEach(function(page){
        page_map[page.id+''] = page;
    });
    prof.stop();
    var prof_contest_find = new Profiler('/models/page/loadPagesContests/Contest.find');
    Bozuko.models.Contest.find(
        {
            active: true,
            page_id: {$in: Object.keys(page_map)},
            start: {$lt: now},
            end: {$gt: now},
            $where: "this.token_cursor < this.total_entries;"
        },
        function( error, contests ){
            prof_contest_find.stop();
            if( error ) return callback(error);

            var prof_load = new Profiler('/models/page/loadPagesContests/load');

            // attach active contests to pages
            return async.forEach(contests,
                function iterator(contest, cb){
                    var page = page_map[contest.page_id+''];
                    if( !page.contests ){
                        page.contests = [];
                    }
                    // load contest game state
                    contest.loadGameState(user, function(error){
                        contest.loadEntryMethod(user, function(error){
                            page.contests.push(contest);
                            cb(error);
                        });
                    });
                },
                function contests_foreach_callback(err){
                    prof_load.stop();
                    if (err) return callback(err);
                    return callback(null, pages);
                }
            );
        }
    );
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
            offsets.push(
                pool.splice( rand(0, pool.length-1), 1)[0]
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

                console.log(opts);

                return Bozuko.models.Page.find(opts.selector, {}, opts.options, function(error, page){
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
        bozukoSearch.selector.name = new RegExp('^'+XRegExp.escape(options.query), "i");
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
        bozukoSearch.selector = {
            _id: {$in:user.favorites||[]},
            coords: {
                $nearSphere: options.ll
            }
        };

        serviceSearch = false;
    }
    // are we looking for bounded results
    else if( options.bounds ){

        bozukoSearch.selector = {
            // only registered ?
            owner_id: {$exists:true},
            coords: {$within: {$box: options.bounds}}
        };
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
            bozukoSearch.selector['$or'] = [{test: true}, {featured:true}];
            bozukoSearch.selector['coords'] = {$near: options.ll};
        }
        else if( !page ){
            var distance = Bozuko.config.search.nearbyRadius / Geo.earth.radius.mi;
            bozukoSearch.selector.coords = {$near: options.ll, $maxDistance: distance};
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
            page.distance = Geo.formatDistance( Geo.distance(options.ll, page.coords));
            if(fn) fn.call(this, page);
        }
        prof.stop();
    }

    function return_pages(pages){
        var count = 0;
        if( hideFeaturedPastThreshold ){
            pages.forEach(function(page){
                if( page.featured && (!getFeatured || ++count > Bozuko.config.search.featuredResults )){
                    page.featured = false;
                }
            });
        }
        callback( null, pages );
    }

    return Bozuko.models.Page.getFeaturedPages(getFeatured ? Bozuko.config.search.featuredResults : 0, options, function(error, featured){

        if( error ) return callback(error);

        if( featured.length ){
            var ids = [];
            featured.forEach(function(feature){ ids.push( feature._id ); });
            bozukoSearch.selector._id = {
                $nin: ids
            };
        }
        
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
                });
                
                

                if( !serviceSearch ){
                    return return_pages( pages );
                }

                options.center=options.ll;

                // use a 3rd party service to get additional results
                // and then match against our db
                var service = options.service || Bozuko.config.defaultService;

                return Bozuko.service(service).search(options, function(error, _results){

                    if( error ) return callback(error);

                    var map = {}, results = [];
                    
                    if( _results ) _results.forEach( function(place, index){
                        if( ~fb_ids.indexOf(String(place.id)) ) return;
                        results.push(place);
                        map[String(place.id)] = place;
                    });

                    return Bozuko.models.Page.findByService(service, Object.keys(map), {
                        owner_id: {
                            $exists: true
                        },
                        _id: {$nin: page_ids}
                    }, function(error, _pages){
                        if( error ) return callback( error );
                        prepare_pages(_pages, options.user, function(page){
                            results.splice( results.indexOf(map[page.service(service).sid]), 1 );
                        });

                        if (results) {
                            results.forEach(function(result){
                                result.registered = false;
                                result._distance = Geo.distance(options.ll, [result.location.lng,result.location.lat]);
                                result.distance = Geo.formatDistance( Geo.distance(options.ll, [result.location.lng,result.location.lat]));
                            });
                        }
                        
                        return Bozuko.models.Page.loadPagesContests(_pages, options.user, function(error, _pages){
                            pages = pages.concat(_pages);
                            pages = pages.concat(results);
                            
                            // sort these pages by distance...
                            pages.sort( page_search_sort );
                            return return_pages(pages);
                        });
                    });
                });
            });
        });
    });
});

function page_search_sort(a,b){
    // okay, they are pretty equal, lets sort by _distance
    return a._distance - b._distance;
}