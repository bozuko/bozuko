var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Play = module.exports = new Schema({
    contest_id          :{type:ObjectId},
    user_id             :{type:ObjectId},
    timestamp           :{type:Date},
    game                :{type:String},
    win                 :{type:Boolean},
    prize_id            :{type:ObjectId},
    prize_name          :{type:String}
});