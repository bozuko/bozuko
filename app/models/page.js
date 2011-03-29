var _t = Bozuko.t;
    facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    merge = require('connect').utils.merge,
    Schema = mongoose.Schema,
    Service = require('./embedded/service'),
    ObjectId = Schema.ObjectId;

var Page = module.exports = new Schema({
    // path is for creating a tree structure
    path                :{type:String},
    description         :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String},
    image               :{type:String},
    location            :{
        lat                 :Number,
        lng                 :Number,
        street              :String,
        city                :String,
        state               :String,
        zip                 :String,
        country             :String
    },
    owner_id            :{type:ObjectId, index: true}
});

Service.initSchema(Page);

Page.index('location', '2d');

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
            // options.picture = 'http://bozuko.com/images/bozuko-chest-check.png';
            options.picture = self.image;
            
            // okay, lets try to give them entries on all open contests
            if( contests.length === 0 ){
                // lets set a generic checkin message
                // options.name = _t(user.lang, 'checkin/general_checkin_name');
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
               // options.name = _t(user.lang, 'checkin/general_checkin_name', self.name);
                options.description = _t(
                    user.lang,
                    'checkin/contest_checkin_desc',
                    user.name,
                    self.name,
                    game.name,
                    contest.getBestPrize().name
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
    var id = place.id;
    var service = place.service;
    delete place.id;
    delete place.sid;
    delete place.service;
    var page = new Bozuko.models.Page();
    Object.keys(place).forEach(function(prop){
        page.set(prop, place[prop]);
    });
    page.is_location = true;
    page.service( service, id, null, place.data);
    page.save( function(error){
        if( error ){
            return callback( error );
        }
        return Bozuko.models.Page.findById(page.id, callback);
    });
});

Page.static('search', function(options, callback){

    // use a 3rd party service to search geographically
    // and then match against our db
    var service = options.service || Bozuko.config.defaultService;

    Bozuko.service(service).search(options, function(error, results){
        var map = {};
        if( results ) results.forEach( function(place, index){
            // lets create a map for searching...
            map[place.id] = place;
        });
        else{
            callback( null, [] );
        }
        Bozuko.models.Page.findByService(service, Object.keys(map), function(error, pages){
            if( error ) return callback( error );
            
            var page_map = {};
            pages.forEach(function(page){
                page_map[page.id+''] = page;
                results.splice( results.indexOf(map[page.service(service).id]), 1 );
            });
            
            var now = new Date();
            
            return Bozuko.models.Contest.find(
                {
                    page_id: {$in: Object.keys(page_map)},
                    start: {$lt: now},
                    end: {$gt: now},
                    $where: "this.token_cursor < this.total_entries;"
                },
                function( error, contests ){
                
                    if( error ) return callback(error);
                    
                    // attach active contests to pages
                    contests.forEach(function(contest){
                        var page = page_map[contest.page_id+''];
                        if( !page.contests ){
                            page.contests = [];
                        }
                        page.contests.push(contest);
                    });
                
                    return callback(null, {pages: pages, service_results: results});
                }
            );
        });
    });
});