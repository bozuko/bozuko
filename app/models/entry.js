var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Entry = module.exports = new Schema({
    contest_id              :{type:ObjectId, index: true},
    page_id                 :{type:ObjectId, index: true},
    user_id                 :{type:ObjectId, index: true},
    type                    :{type:String},
    action_id               :{type:ObjectId},
    timestamp               :{type:Date, default: Date.now},
    wall_posts              :{type:Number},
    tokens                  :{type:Number},
    initial_tokens          :{type:Number}
});