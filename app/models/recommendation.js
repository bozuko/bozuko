var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Recommendation = module.exports = new Schema({
    page_id                 :{type:ObjectId,        index: true},
    user_id                 :{type:ObjectId,        index: true},
    timestamp               :{type:Date,            default: Date.now},
    message                 :{type:String}
});