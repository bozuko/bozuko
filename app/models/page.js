var bozuko = require('bozuko'),
    _ = bozuko.t;
    facebook = bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
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
    bozuko.models.User.findById( this.owner_id, callback );
});

Page.method('getContests', function(callback){
    bozuko.models.Contest.find({page_id:this.id}, callback);
});

Page.method('getActiveContests', function(callback){
    var now = new Date();
    bozuko.models.Contest.find({
        page_id:this.id,
        start: {$lt: now},
        end: {$gt: now},
        $where: "this.token_cursor < this.total_entries;"
    }, callback);
});

Page.method('checkin', function(user, options, callback) {
    var self = this;
    
    // first, we should find out if they are within the bounds of
    // another checkin...
    /**
     * TODO
     *
     * We need to decide how these checkins will be handled on a per service
     * basis, per location, per user.
     * 
     * bozuko.models.Checkin.findOne({$or:{page_id:this.id, timestamp:{$gt:duration}},)
     * 
     */
    
    this.getActiveContests(function(error, contests){
        if( error ) return callback(error);
        
        options.user = user;
        options.link = 'http://bozuko.com';
        options.picture = 'http://bozuko.com/images/bozuko-chest-check.png';
        
        // okay, lets try to give them entries on all open contests
        if( contests.length === 0 ){
            // lets set a generic checkin message
            options.name = _t('en', 'checkin/general_checkin_name');
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
            options.name = _t('en', 'checkin/general_checkin_name', self.name);
            options.description = _t(
                user.lang,
                'checkin/contest_checkin_desc',
                user.name,
                self.name,
                game.name,
                contest.getBestPrize().name
            );
        }
        // okay, we have "everything we need to make a checkin, lets
        // do so with our checkin model
        
        var current = 0;
        return contests.forEach( function(contest){
            
            // try to enter the contest
            
        });
        return callback( null, bozuko.transfer('facebook_result'), {tokens: 2, timestamp: new Date(), duration: 24*60*60*1000} );
    
    /*return contest.enter(
        bozuko.entry('facebook/checkin', req.session.user, {
            latLng: {lat:lat, lng:lng},
            message: msg
        }),
        function(error, entry){
            
            if( error ){
                error.send(res);
                return;
            }
            var fb_checkin_res = {
                id: entry._id,
                timestamp: entry.timestamp,
                tokens: entry.tokens,
                links: {
                    contest_result: "/contest/"+contest.id+"/result",
                    facebook_like: "/facebook/"+id+"/like"
                }
            };
            var ret = bozuko.sanitize('facebook_checkin_result', fb_checkin_res);
            res.send(ret);
        }*/
    });
});

Page.static('createFromServiceObject', function(place, callback){
    var id = place.id;
    delete place.id;
    var page = new bozuko.models.Page(place);
    page.is_location = true;
    page.service( place.service, place.id, null, place.data);
    page.save( function(error){
        if( error ) return callback( error );
        return bozuko.models.Page.findById(page.id, callback);
    });
});

Page.static('search', function(options, callback){

    // use a 3rd party service to search geographically
    // and then match against our db
    var service = options.service || bozuko.config.defaultService;

    bozuko.service(service).search(options, function(error, results){
        var map = {};
        if( results ) results.forEach( function(place, index){
            // lets create a map for searching...
            map[place.id] = place;
        });
        else{
            callback( null, [] );
        }
        bozuko.models.Page.findByService(service, {$in:Object.keys(map)}, function(error, pages){
            if( error ) return callback( error );
            
            var page_map = {};
            pages.forEach(function(page){
                page_map[page.id+''] = page;
                results.splice( results.indexOf(map[page.service(service).id]), 1 );
            });
            
            var now = new Date();
            
            return bozuko.models.Contest.find(
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