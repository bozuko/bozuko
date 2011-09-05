var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Play = module.exports = new Schema({
    contest_id              :{type:ObjectId,        index: true},
    page_id                 :{type:ObjectId,        index: true},
    user_id                 :{type:ObjectId,        index: true},
    entry_id                :{type:ObjectId,        index: true},
    uuid                    :{type:String},
    play_cursor             :{type:Number},
    timestamp               :{type:Date,            index: true},
    game                    :{type:String},
    win                     :{type:Boolean},
    free_play               :{type:Boolean},
    prize_id                :{type:ObjectId,        index: true},
    prize_name              :{type:String},
    consolation             :{type:Boolean},
    consolation_prize_id    :{type:ObjectId,        index: true},
    consolation_prize_name  :{type:String,          default: false}
},{safe: {w:2, wtimeout: 5000}});
