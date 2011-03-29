var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Prize = module.exports = new Schema({
    value                   :{type:Number},
    image                   :{type:String},
    name                    :{type:String},
    description             :{type:String},
    details                 :{type:String},
    instructions            :{type:String},
    image                   :{type:String},
    total                   :{type:Number},
    claimed                 :{type:Number}
});