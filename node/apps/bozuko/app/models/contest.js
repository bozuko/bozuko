var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ContestConfig = bozuko.require('models/embedded/game/config'),
    ObjectId = Schema.ObjectId;

var ContestConfig = new Schema({
    
});

var Contest = module.exports = new Schema({
    page                    :{type:ObjectId, index :true},
    games                   :[ContestConfig],
    start                   :{type:Date},
    end                     :{type:Date},
    total_entries           :{type:Number},
    results                 :{type:Array},
    play_cursor             :{type:Number},
    token_cursor            :{type:Number}
});

/**
 * Enter a contest
 *
 * @param {EntryMethod} 
 */
Contest.method('enter', function(user, entryMethod){
    
});