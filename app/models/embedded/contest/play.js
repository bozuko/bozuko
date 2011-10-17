var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Play = module.exports = new Schema({
    timestamp               :{type:Date, index: true},
    user_id                 :{type:ObjectId},
    cursor                  :{type:Number}
});