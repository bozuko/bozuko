var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Entry = module.exports = new Schema({
    contest_id              :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    user_id                 :{type:ObjectId,    index: true},
    /* page and user names for searching */
    user_name               :{type:String},
    page_name               :{type:String},
    type                    :{type:String},
    action_id               :{type:ObjectId},
    timestamp               :{type:Date,        default: Date.now, index: true},
    wall_posts              :{type:Number,      default: 0},
    tokens                  :{type:Number},
    initial_tokens          :{type:Number}
}, {safe:null});