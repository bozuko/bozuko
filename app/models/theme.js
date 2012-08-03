var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Theme = module.exports = new Schema({
    timestamp               :{type:Date,        default:Date.now},
    apikey_id               :{type:ObjectId},
    name                    :{type:String},
    alias                   :{type:String},
    background              :{type:String},
    icon                    :{type:String}
});