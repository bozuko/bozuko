var bozuko = require('bozuko'),
    facebook = bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Service = require('./embedded/service'),
    ObjectId = Schema.ObjectId;

var Page = module.exports = new Schema({
    services            :[Service],
    path                :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String},
    lat                 :{type:Number},
    lng                 :{type:Number},
    owner_id            :{type:ObjectId, index: true}
});

Service.initSchema(Page);

Page.method('getOwner', function(callback){
    bozuko.models.User.findById( this.owner_id, callback );
});

Page.method('getContests', function(callback){
    bozuko.models.Contest.find({page_id:this.id}, function(error, contests){
        if( error ){
            throw error;
        }
        callback(contests);
    });
});

Page.method('checkin', function(user, game, callback) {

    var self = this;

    bozuko.models.Checkin
        .findOne({user_id:user.id,place_id:this.id},[],{sort:{'timestamp':-1}}, function(lastCheckin){
            var doCheckin = true;

            // first we need to check for the last checkin and make sure
            // that its not too close to the last one.
            /*
            if( lastCheckin ){
                var now = new Date();
                if( now.getTime() - lastCheckin.timestamp.getTime() < bozuko.config.checkin.interval ){
                    doCheckin = false;
                }
            }
            */

            if( doCheckin ){

                var checkin = new bozuko.models.Checkin();

                checkin.place_id = self.id;

                checkin.place_facebook_id = self.service('facebook').id;

                checkin.user_id = user.id;
                checkin.user_facebook_id = user.self.service('facebook').id;

                checkin.game_id = game.id;

                // still need to contact facebook.
            }
        });
});

Page.static('search', function(options, callback){

    // use a 3rd party service to search geographically
    // and then match against our db
    bozuko.service('facebook').search(options, function(error, result){
        var map = {};
        if( result.data ) result.data.forEach( function(place){
            // lets create a map for searching...
            map[place.id] = place;
        });
        else{
            callback(new Error('No results'));
        }

        bozuko.models.Page.find({'services.name':'facebook','services.id':{$in:Object.keys(map)}}, function(err, bozuko_pages){
            bozuko_pages.forEach(function(page){
                delete map[page.service('facebook').id];
            });
            var fb_pages = [];
            for (var i in map) {
                fb_pages.push(map[i]);
            }

            callback({bozuko_pages: bozuko_pages, facebook_pages: fb_pages});
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