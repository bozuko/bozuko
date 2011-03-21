var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Entry = module.exports = new Schema({
    contest_id              :{type:ObjectId, index :true},
    user_id                 :{type:ObjectId},
    type                    :{type:String},
    timestamp               :{type:Date},
    latitude                :{type:Number},
    longitude               :{type:Number},
    tokens                  :{type:Number},
    data                    :{}
});