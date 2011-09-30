var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    NativePlugin = require('./plugins/native');
;

var Cache = module.exports = new Schema({
    _id                     :{type: String,     index: true},
    timestamp               :{type: Date,       index: true,        default: Date.now},
    value                   :{}
});