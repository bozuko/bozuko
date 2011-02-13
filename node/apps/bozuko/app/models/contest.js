var facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Page = module.exports = new Schema({
    game                    :{type:ObjectId, index: true}
});
