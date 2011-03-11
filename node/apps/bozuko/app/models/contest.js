var bozuko = require('bozuko');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var GameConfig = new Schema({
    name                    :{type:String},
    // game configs are arbitrary
    config                  :{}
});
var Contest = module.exports = new Schema({
    page                    :{type:ObjectId, index :true},
    games                   :[GameConfig],
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