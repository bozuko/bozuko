var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var EntryConfig = module.exports = new Schema({
    name            :{type:String, index: true},
    duration        :{type:Number},
    tokens          :{type:Number},
    options         :{}
});