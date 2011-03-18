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
    game_config             :[GameConfig],
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
            // this will return an Entry object on success.
            callback(error, Entry);
        });
    });
});

Contest.path('games', function(){
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