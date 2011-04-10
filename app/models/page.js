var _t = Bozuko.t;
    facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    merge = require('connect').utils.merge,
    Schema = mongoose.Schema,
    Service = require('./embedded/service'),
    Coords = require('./embedded/coords'),
    Geo = Bozuko.require('util/geo'),
    ObjectId = Schema.ObjectId;

var Page = module.exports = new Schema({
    // path is for creating a tree structure
    path                :{type:String},
    description         :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String},
    image               :{type:String},
    use_twitter         :{type:Boolean, default: false},
    twitter_id          :{type:String},
    announcement        :{type:String},
    security_img        :{type:String},
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

Service.initSchema(Page);
Coords.initSchema(Page);

Page.method('getOwner', function(callback){
    Bozuko.models.User.findById( this.owner_id, callback );
});

Page.method('getContests', function(callback){
    Bozuko.models.Contest.find({page_id:this.id}, callback);
});

Page.method('getActiveContests', function(callback){
    var now = new Date();
    var params = {
        page_id:this.id,
        start: {$lt: now},
        end: {$gt: now},
        $where: "this.token_cursor < this.total_entries;"
    };
    if( arguments.length == 2 ){
        callback = arguments[1];

    }
    Bozuko.models.Contest.find(params, callback);
});

Page.method('getUserGames', function(user, callback){
    this.getActiveContests( function(error, contests){
        if( error ) return callback(error);

        var ids = [];
        var games = [];
        var gamesMap= {};
        var contestMap = {};
        contests.forEach( function(contest){
            contestMap[contest._id+''] = contest;
            ids.push( contest._id );
        });

        return Bozuko.models.Entry.find({
            tokens: {$gt: 0},
            user_id: user._id,
            contest_id: {$in: ids}
        }, function(error, entries){
            if( error ) return callback( error );
            var total = 0;
            entries.forEach( function(entry){
                var key = ''+entry.contest_id;
                var game = gamesMap[key];
                if( !game ){
                    var contest = contestMap[''+entry.contest_id];
                    var game = contest.getGame();
                    gamesMap[key] = game;
                    games.push(game);
                }
                if( !game.tokens )  game.tokens = 0;
                game.tokens+= entry.get('tokens');
            });
            return callback( null, games );
        });
    });
});

Page.method('canUserCheckin', function(user, callback){

    var self = this;
    var now = new Date();

    var page_last_allowed_checkin = new Date();
    var user_last_allowed_checkin = new Date();

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
                options.name = _t(user.lang, 'checkin/general_checkin_name', self.name);
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
                if( error ) return error;

                if( contests.length == 0 ){
                    return callback( null, {checkin:checkin, entries:[]} );
                }
                var current = 0, entries = [];
                return contests.forEach( function(contest){
                    // try to enter the contest
                    var entry = Bozuko.entry(options.service+'/checkin', user, {
                        checkin: checkin
                    });
                    contest.enter( entry, function(error, entry){
                        if( error ){
                            return callback( error );
                        }
                        entries.push(entry);
                        if( ++current == contests.length ){
                            return callback( null, {checkin:checkin, entries:entries});
                        }
                        console.log(current);
                        return true;
                    });
                });
            });

        });
    });
});

Page.static('createFromServiceObject', function(place, callback){
    var ignore = ['id','service','lat','lng','data'];

    var page = new Bozuko.models.Page();
    Object.keys(place).forEach(function(prop){
        if( !~ignore.indexOf(prop) ) page.set(prop, place[prop]);
    });

    page.set('is_location', true);
    page.set('coords',[place.location.lng, place.location.lat]);
    page.service( place.service, place.id, null, place.data);
    page.save( function(error){
        if( error ){
            return callback( error );
        }
        return Bozuko.models.Page.findById(page.id, callback);
    });
});

Page.static('loadPagesContests', function(pages, callback){
    var page_map = {}, now = new Date();
    pages.forEach(function(page){
        page_map[page.id+''] = page;
    });
    Bozuko.models.Contest.find(
        {
            page_id: {$in: Object.keys(page_map)},
            start: {$lt: now},
            end: {$gt: now},
            $where: "this.token_cursor < this.total_entries;"
        },
        function( error, contests ){

            if( error ) return callback(error);

            var contestMap = {};

            // attach active contests to pages
            contests.forEach(function(contest){
                contestMap[contest._id+''] = contest;
                var page = page_map[contest.page_id+''];
                if( !page.contests ){
                    page.contests = [];
                }
                page.contests.push(contest);
            });


            /**
             *              * TODO
             *              *
             *              * Use the "expiration" property for entry model to
             *              * expire the tokens between entries
             *              *
             *              * or
             *              *
             *              * Upon new entry, delete the tokens off any existing
             *              * entries
             *              */
            // find active entries for this user in each contest
            return Bozuko.models.Entry.find({
                contest_id: {$in: Object.keys(contestMap)},
                tokens: {$gt: 0}
            }, function(error, entries){
                if( error ) return callback(error);

                if( entries ) entries.forEach( function(entry){
                    // find the contest
                    var contest = contestMap[entry.contest_id+''];
                    if( !contest.tokens ) contest.tokens = 0;
                    contest.tokens+= entry.tokens;

                    // also need to figure out which methods of entry are available
                    // we will need to use the contest entry configuration
                    // for this.
                    /**
                     *                      * Pseudo code
                     *                      *
                     *                      * contest.getValidEntryMethods( fn(){} );
                     *                      *
                     *                      */
                });

                return callback(null, pages);
            });
        }
    );
});

/**
 *  * mongo find using the low level database driver. The callback is always the last argument.
 *  *
 *  * BE CAREFUL when creating the 'selector' parameter as variables will _not_ be cast
 *  * to the type defined in the mongoose Schema, so it must be done manually.
 *  *
 *  * This is needed for performing "within" searches as I do not see how it is done
 *  * within mongoose right now.
 *  *
 *  * Various argument possibilities
 *  * 1 callback
 *  * 2 selector, callback,
 *  * 3 selector, fields, callback
 *  * 3 selector, options, callback
 *  * 4,selector, fields, options, callback
 *  * 5 selector, fields, skip, limit, callback
 *  * 6 selector, fields, skip, limit, timeout, callback
 *  *
 *  * Available options:
 *  * limit, sort, fields, skip, hint, explain, snapshot, timeout, tailable, batchSize
 *  */
Page.static('nativeFind', function(){
    var coll = Bozuko.models.Page.collection;
    var cb = arguments[arguments.length-1];
    arguments[arguments.length-1] = function(error, cursor){

        // we are going to change this to model objects...
        if( error ){
            return callback(error);
        }
        // convert to model objects
        var pages = [];
        return cursor.toArray( function (err, docs) {
            if (err) return callback(err);
            for (var i = 0; i < docs.length; i++) {
                pages[i] = new Bozuko.models.Page();
                pages[i].init(docs[i], function (err) {
                    if (err) return callback(err);
                    return true;
                });
            }
            return cb(null, pages);
        });
    }
    coll.find.apply(coll, arguments);
});

/**
 *  * Big honkin search function that does all the page searches
 *  * including a search (by location - center), "favorites" (by location - center),
 *  *
 *  */
Page.static('search', function(options, callback){

    var bozukoSearch = {type:'find', selector:{}, options:{}};
    var serviceSearch = {};
    if( options.query ){
        bozukoSearch.selector.name = new RegExp('^'+options.query, "i");
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
         *          * TODO
         *          *
         *          * Decide if we should also perform a service search
         *          *
         *          */
        serviceSearch = false;
    }
    /**
     *      * This is a standard center search, we will use a service to get
     *      * additional results, but also do a search
     *      *
     *      */
    else {

        var distance = Bozuko.config.search.nearbyRadius / Geo.earth.radius.mi;
        bozukoSearch.selector = {
            // only registered...
            coords: {$nearSphere: options.ll, $maxDistance: distance}
        };
        bozukoSearch.options.limit = Bozuko.config.search.nearbyMin;
        bozukoSearch.type='nativeFind';
    }

    // utility function
    function prepare_pages(pages, user, fn){
        for(var i=0; i<pages.length; i++){
            var page = pages[i];
            if( options.user ){
                page.favorite = ~(options.user.favorites||[]).indexOf(page._id);
            }
            if( page.owner_id ){
                page.registered = true;
            }
            page.distance = Geo.formatDistance( Geo.distance(options.ll, page.coords));
            if(fn) fn.call(this, page);
        }
    }
    return Bozuko.models.Page[bozukoSearch.type](bozukoSearch.selector, bozukoSearch.options, function(error, pages){
        if( error ) return callback(error);

        return Bozuko.models.Page.loadPagesContests(pages, function(error, pages){
            if( error ) return callback(error);
            var page_ids = [];
            
            prepare_pages(pages, function(page){ page_ids.push(page._id);});
            
            if( !serviceSearch ){
                return callback(null, pages);
            }
            
            options.center=options.ll;

            // use a 3rd party service to get additional results
            // and then match against our db
            var service = options.service || Bozuko.config.defaultService;

            return Bozuko.service(service).search(options, function(error, results){

                if( error ) return callback(error);

                var map = {};
                if( results ) results.forEach( function(place, index){
                    map[place.id] = place;
                });
                
                return Bozuko.models.Page.findByService(service, Object.keys(map), {
                    owner_id: {
                        $exists: true
                    },
                    _id: {$nin: page_ids}
                }, function(error, _pages){
                    if( error ) return callback( error );
                    prepare_pages(_pages, function(page){
                        results.splice( results.indexOf(map[page.service(service).sid]), 1 );
                    });
                    pages.forEach(function(page){
                        results.splice( results.indexOf(map[page.service(service).sid]), 1 );
                    });
                    results.forEach(function(result){
                        result.distance = Geo.formatDistance( Geo.distance(options.ll, [result.location.lng,result.location.lat]));
                    });

                    return Bozuko.models.Page.loadPagesContests(_pages, function(error, _pages){
                        pages = pages.concat(_pages);
                        pages = pages.concat(results);
                        return callback(null, pages);
                    });
                });
            });
        });
    });
});
