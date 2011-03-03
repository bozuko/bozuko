var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Service = new Schema({
    name                :{type:String}
});
var User = module.exports = new Schema({
    name                :{type:String},
    first_name          :{type:String},
    last_name           :{type:String},
    gender              :{type:String},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    facebook_id         :{type:String, index: true},
    services            :[Service],
    favorites           :[ObjectId],
    facebook_auth       :{type:String},
    can_manage_pages    :{type:Boolean} 
});

User.method('getResults', function(callback){
    
});