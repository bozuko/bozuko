var bozuko = require('bozuko');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Prize = module.exports = new Schema({
    page                    :{type:ObjectId, index :true},
    contest                 :{type:ObjectId}
});
