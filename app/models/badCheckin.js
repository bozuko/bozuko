var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var BadCheckin = module.exports = new Schema({
    user_id                 :{type:ObjectId},
    fb_place_id             :{type:String},
    place                   :{type:String},
    timestamp               :{type:Date},
    ll                      :[],
    distance                :{type:Number},
    accuracy                :{type:Number},
    radius                  :{type:Number}
});

