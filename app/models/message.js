var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    NativePlugin = require('./plugins/native');
;

var Message = module.exports = new Schema({
    _id                     :{type: Number,     index: true},
    timestamp               :{type: Date,       index: true},
    type                    :{type: String},
    message                 :{}
});

Message.plugin( NativePlugin );