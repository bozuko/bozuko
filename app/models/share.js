var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Share = module.exports = new Schema({
    timestamp               :{type:Date,        default: Date.now},
    contest_id              :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    user_id                 :{type:ObjectId,    index: true},
    type                    :{type:String},
    service                 :{type:String},
    visibility              :{type:Number,      default: 0},
    message                 :{type:String}
});