var facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Page = module.exports = new Schema({
    facebook_id        :{type:String, index: true},
    facebook_auth      :{type:String},
    games              :{type:Array}, 
    is_location        :{type:Boolean},
    name               :{type:String},
    lat                :{type:Number},
    lng                :{type:Number},
    owner_id           :{type:ObjectId, index: true}
});
    
    /*
Page.pre('save', function(next){
    if( this.isNew ){
        this.sign_up_date = new Date();
    }
    next();
});
    */
Page.method('checkin', function(user, game, callback) {
            
    var self = this;
    
    Bozuko.models.Checkin
        .findOne({user_id:user.id,place_id:this.id},[],{sort:{'timestamp':-1}}, function(lastCheckin){
            var doCheckin = true;
            
            // first we need to check for the last checkin and make sure
            // that its not too close to the last one.
            /*
            if( lastCheckin ){
                var now = new Date();
                if( now.getTime() - lastCheckin.timestamp.getTime() < Bozuko.config.checkin.interval ){
                    doCheckin = false;
                }
            }                     
            */
            
            if( doCheckin ){
                
                var checkin = new Bozuko.models.Checkin();
                
                checkin.place_id = self.id;
                checkin.place_facebook_id = self.facebook_id;
                
                checkin.user_id = user.id;
                checkin.user_facebook_id = user.facebook_id;
                
                checkin.game_id = game.id;
                
                // still need to contact facebook.
            }
        });
});

Page.static('search', function(center, limit, callback){
            
    // lets give them just the coinflip game for now...
    // this needs to be generated from Bozuko.games
    // + the 
    var games = [];
    
    for(var id in Bozuko.games){
        if( id == 'dice') continue;
        var game = Bozuko.games[id];
        game.id = id;
        game.name = game.config.name;
        game.icon = '/game/'+id+'/images/'+game.config.icon;
        game.prize = 'Free Buffalo Wings and Potato Skins!';
        games.push(game);
    }
    
    facebook.graph( '/search',
        /* Facebook Options */
        {
            params: {
                type: 'place',
                center : center,
                limit : limit
            }
        },
        /* Callback */
        function(result){
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
            
            Bozuko.models.Page.find({facebook_id:{$in:Object.keys(map)}}, function(err, bozuko_places){
                
                result.data.forEach( function(place, index){
                    place.games = index%1==0 ? games : [];
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