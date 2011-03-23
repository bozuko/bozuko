var bozuko = require('bozuko'),
    facebook = bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Service = require('./embedded/service'),
    ObjectId = Schema.ObjectId;

var Page = module.exports = new Schema({
    // path is for creating a tree structure
    path                :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String},
    location            :{
        street              :String,
        city                :String,
        state               :String,
        zip                 :String,
        country             :String
    },
    position            :{
        latitude            :Number,
        longitude           :Number
    },
    lat                 :{type:Number},
    lng                 :{type:Number},
    owner_id            :{type:ObjectId, index: true}
});

Service.initSchema(Page);
Page.index('position', '2d');

Page.method('getOwner', function(callback){
    bozuko.models.User.findById( this.owner_id, callback );
});

Page.method('getContests', function(callback){
    bozuko.models.Contest.find({page_id:this.id}, function(error, contests){
        callback(error, contests);
    });
});

Page.method('getActiveContests', function(callback){
    var now = new Date();
    bozuko.models.Contest.find({
        page_id:this.id,
        start: {$lt: now},
        end: {$gt: now},
        $where: "this.token_cursor < this.total_entries;"
    }, function(error, contests){
        callback(error, contests);
    });
});


/**
 * Not sure about this right now...
 */
Page.method('checkin', function(user, game, callback) {

    var self = this;

    bozuko.models.Checkin
        .findOne({user_id:user.id,place_id:this.id},[],{sort:{'timestamp':-1}}, function(lastCheckin){
            var doCheckin = true;
            if( doCheckin ){
                var checkin = new bozuko.models.Checkin();
                checkin.place_id = self.id;
                checkin.place_facebook_id = self.service('facebook').sid;
                checkin.user_id = user.id;
                checkin.user_facebook_id = user.self.service('facebook').sid;
                checkin.game_id = game.id;
                // still need to contact facebook.
            }
        });
});

Page.static('createFromServiceObject', function(place, callback){
    var page = new bozuko.models.Page();
    page.name = place.name;
    page.location = place.location;
    page.position = {
        lat: place.location.lat,
        lng: place.location.lng
    },
    page.is_location = true;
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
        if( results ) results.forEach( function(place){
            // lets create a map for searching...
            map[place.id] = place;
        });
        else{
            callback(new Error('No results'));
        }
        bozuko.models.Page.find({'services.name':service,'services.sid':{$in:Object.keys(map)}}, function(err, bozuko_pages){
            bozuko_pages.forEach(function(page){
                delete map[page.service(service).sid];
            });
            var fb_pages = [];
            for (var i in map) {
                fb_pages.push(map[i]);
            }
            callback(null, {bozuko_pages: bozuko_pages, facebook_pages: fb_pages});
        });

    });
});

Page.static('getByFacebookId', function(facebook_id){
    facebook.graph(facebook_id,
        {

        },
        function(result){

        }
    );
});