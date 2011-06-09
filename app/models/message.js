var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    NativePlugin = require('./plugins/native');
;

var Message = module.exports = new Schema({
    timestamp               :{type: Date, index: true},
    type                    :{type: String},
    content                 :{}
});

Message.plugin( NativePlugin );