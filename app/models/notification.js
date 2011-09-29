var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    NativePlugin = require('./plugins/native');
;

var Notification = module.exports = new Schema({
    _id                     :{type: Number,     index: true},
    timestamp               :{type: Date,       index: true},
    page_id                 :{type: ObjectId,   index: true},
    contest_id              :{type: ObjectId,   index: true},
    user_id                 :{type: ObjectId,   index: true},
    type                    :{type: String},
    name                    :{type: String},
    message                 :{}
});