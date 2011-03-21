var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var EntryConfig = module.exports = new Schema({
    type            :{type:String},
    duration        :{type:Number},
    tokens          :{type:Number},
    options         :{}
});