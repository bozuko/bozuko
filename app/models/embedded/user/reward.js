var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Reward = module.exports = new Schema({
    name                    :{type:String},
    reward_id               :{type:ObjectId, index: true},
    bucks                   :{type:Number},
    timestamp               :{type:Date}
});
