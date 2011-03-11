var bozuko = require('bozuko');

var facebook = bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Service = new Schema({
    name                :{type:String},
    id                  :{type:Number},
    auth                :{type:String},
    data                :{}
});

var Page = module.exports = new Schema({
    services            :[Service],
    path                :{type:String},
    is_location         :{type:Boolean},
    name                :{type:String},
    lat                 :{type:Number},
    lng                 :{type:Number},
    owner_id            :{type:ObjectId, index: true}
});

Page.index({'services.name':1,'services.id':1});

Page.method('service', function(name){
    var service = false;
    for(var i=0; i<this.services.length && !service; i++){
        if( name == this.services[i].name ) service = this.services[i];
    }
    if( !arguments[1] ) return service;
    var add = false;
    
    if( !service ){
        add = true;
        service = {name:name};
    }
    service.id = arguments[1];
    if( arguments[2] ) service.auth = arguments[2];
    if( arguments[3] ) service.data = arguments[3];
    if( add ){
        serivce = this.services[this.services.length] = service;
    }
    return service;
});

Page.method('getOwner', function(callback){
    bozuko.models.User.findById( this.owner_id, callback );
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

    // lets give them just the coinflip game for now...
    // this needs to be generated from bozuko.games
    var games = [];

    for(var id in bozuko.games){
        if( id == 'dice' || id =='slots' ) continue;
        var game = bozuko.games[id];
        game.id = id;
        game.name = game.config.name;
        game.icon = '/game/'+id+'/images/'+game.config.icon;
        game.prize = 'Free Buffalo Wings and Potato Skins!';
        games.push(game);
    }

    // use a 3rd party service to search geographically
    // and then match against our db
    bozuko.service('facebook').search(options,

        /* Callback */
        function(error, result){
            // loop through the results and see if we have a place with
            // the facebook id..
            var map = {};

            if( result.data ) result.data.forEach( function(place){
                // lets create a map for searching...
                map[place.id] = place;
            });
            else{
                callback(new Error('No results'));
            }
            
            bozuko.models.Page.find({'services.name':'facebook','services.id':{$in:Object.keys(map)}}, function(err, bozuko_places){
                
                result.data.forEach( function(place, index){
                    place.games = index%1==0 ? games : [];
                    // TODO: put the real links in here
                    place.links = {
                        checkins: '/contest/2342432/entry/facebook/checkin',
                        contest: '/contest/2342432/',
                        page: '/page/' + place.id
                    };
                });

                callback(result);
            });

        }
    );
});

Page.static('getByFacebookId', function(facebook_id){
    facebook.graph(facebook_id,
        {

        },
        function(result){

        }
    );
});