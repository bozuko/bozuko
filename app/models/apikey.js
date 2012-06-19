var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Apikey = module.exports = new Schema({
    timestamp               :{type:Date,        default:Date.now},
    key                     :{type:String},
    name                    :{type:String},
    description             :{type:String}
});