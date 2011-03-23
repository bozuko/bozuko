var bozuko = require('bozuko');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Prize = module.exports = new Schema({
    value                   :{type:Number},
    name                    :{type:String},
    description             :{type:String},
    total                   :{type:Number},
    claimed                 :{type:Number}
});