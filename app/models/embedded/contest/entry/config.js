var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var EntryConfig = module.exports = new Schema({
    type            :{type:String},
    duration        :{type:Number},
    // tokens here is actually the maximum amount of tokens
    tokens          :{type:Number},
    options         :{}
});