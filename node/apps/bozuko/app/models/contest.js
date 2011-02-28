var bozuko = require('bozuko');

var facebook = bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Page = module.exports = new Schema({
    game                    :{type:ObjectId, index: true}
});
