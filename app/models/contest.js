var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    GameConfig = require('./embedded/contest/game/config'),
    EntryConfig = require('./embedded/contest/entry/config'),
    // ContestPlay = require('./embedded/contest/play'),
    ObjectId = Schema.ObjectId
;

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
    game                    :{type:String},
    game_config             :{},
    entry_config            :[EntryConfig],
    // plays                   :[Play],
    start                   :{type:Date},
    end                     :{type:Date},
    total_entries           :{type:Number},
    results                 :{type:Array},
    play_cursor             :{type:Number},
    token_cursor            :{type:Number},
    winners                 :[ObjectId]
});

/**
 * Enter a contest
 *
 * @param {User}
 * @param {EntryMethod} 
 */
Contest.method('enter', function(entry, callback){
    
    // get the entry_config
    var cfg = null;
    for(var i=0; i<this.entry_config.length && cfg === null; i++){
        if( this.entry_config[i].type == entry.type ){
            cfg = this.entry_config[i];
        }
    }
    entry.setContest(this);
    entry.configure(cfg);
    entry.validate( function(error){
        if( error ){
            // yikes
            callback(error);
        }
        else entry.process( function(error, Entry){
            // this will return an Entry model object on success.
            callback(error, Entry);
        });
    });
});

Contest.method('play', function(user, callback){
    var self = this;
    // first, lets find the entries for this contest
    bozuko.models.Entry.findOne(
        {user_id:user.id, contest_id:this.id, tokens: {$gt:0}},
        function(error, entry){
            if( error ){
                return callback( error );
            }
            else if( !entry ){
                return callback( bozuko.error("contest/no_tokens") );
            }
            // okay, we have an entry that is valid for this game
            // let's play a token
            console.log('play cursor before increment', JSON.stringify(self.play_cursor));
            self.play_cursor++;
            return self.save(function(error, result){
                // now lets get the actual game result
                console.log('play cursor after increment', JSON.stringify(self.play_cursor));
                console.log(result);
                console.log(JSON.stringify(self));
                // bozuko.game( this.game, this.game_config ).play( this, result );
                callback( null, {} );
            });
        }
    );
});

Contest.virtual('games', function(){
    this.games = [];
    this.game_config.forEach(function(config){
        // create an instance of the game
        /**
         * TODO - finish the game instances
         */
    });
    
    // for now, we are just going to return fake games
    return [{
        name : 'slots',
        config: {},
        description: 'Description from the game config',
        icon : ''
    }];
});