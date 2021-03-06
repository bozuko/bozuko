var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Play = module.exports = new Schema({
    contest_id              :{type:ObjectId},
    page_id                 :{type:ObjectId},
    user_id                 :{type:ObjectId},
    entry_id                :{type:ObjectId},
    uuid                    :{type:String},
    play_cursor             :{type:Number},
    timestamp               :{type:Date},
    game                    :{type:String},
    win                     :{type:Boolean},
    free_play               :{type:Boolean},
    prize_id                :{type:ObjectId},
    prize_name              :{type:String},
    consolation             :{type:Boolean},
    consolation_prize_id    :{type:ObjectId},
    consolation_prize_name  :{type:String,          default: false}
},{safe: {j:true}});

Play.index({contest_id: 1, user_id: 1, timestamp: -1});
