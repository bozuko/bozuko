var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Checkin = module.exports = new Schema({
    user_id                 :{type:ObjectId},
    page_id                 :{type:ObjectId},
    timestamp               :{type:Date, default: Date.now},
    lat                     :{type:Number},
    lng                     :{type:Number},
    message                 :{type:String},
    service                 :{type:String}
});