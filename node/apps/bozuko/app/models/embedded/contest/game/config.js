var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var GameConfig = module.exports = new Schema({
    name            :{type:String, index: true},
    options         :{}
});