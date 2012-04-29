var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Pageview = module.exports = new Schema({
    timestamp               :{type:Date,        default: Date.now},
    contest_id              :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    type                    :{type:String},
    url                     :{type:String},
    referer                 :{type:String},
    src                     :{type:String},
    ip                      :{type:String}
});