var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Optin = module.exports = new Schema({
    user_id                 :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    timestamp               :{type:Date,        index: true,    default: Date.now}
}, {safe: {w:2, wtimeout: 5000}});