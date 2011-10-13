var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    NativePlugin = require('./plugins/native');
;

var Email = module.exports = new Schema({
    timestamp               :{type: Date,       index: true,    default: Date.now},
    delivered               :{type: Date},
    user                    :{type: String},
    to                      :{type: String,     index: true},
    user_id                 :{type: ObjectId,   index: true},
    subject                 :{type: String},
    body                    :{type: String},
    html                    :{type: String},
    status                  :{type: String}
});