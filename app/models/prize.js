var bozuko = require('bozuko');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Prize = module.exports = new Schema({
    contest_id              :{type:ObjectId},
    page_id                 :{type:ObjectId},
    user_id                 :{type:ObjectId, index: true},
    play_id                 :{type:ObjectId},
    contest                 :{type:ObjectId},
    value                   :{type:Number},
    name                    :{type:String},
    expires                 :{type:Date},
    description             :{type:String}
});
