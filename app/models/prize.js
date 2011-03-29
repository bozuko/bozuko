var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Prize = module.exports = new Schema({
    contest_id              :{type:ObjectId, index:true},
    page_id                 :{type:ObjectId, index:true},
    user_id                 :{type:ObjectId, index:true},
    play_id                 :{type:ObjectId},
    entry_id                :{type:ObjectId},
    value                   :{type:Number},
    name                    :{type:String},
    image                   :{type:String},
    status                  :{type:String},
    message                 :{type:String},
    expires                 :{type:Date},
    description             :{type:String},
    details                 :{type:String},
    instructions            :{type:String},
    redeemed                :{type:Boolean},
    redeem_date             :{type:Date}
});
