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
        if( this.entry_config[i].key == entryMethod.key ){
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
            callback();
        });
    });
    
    
});