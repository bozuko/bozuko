var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Service = require('./embedded/service')
    ;

var User = module.exports = new Schema({
    name                :{type:String},
    first_name          :{type:String},
    last_name           :{type:String},
    gender              :{type:String},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    services            :[Service],
    favorites           :[ObjectId],
    can_manage_pages    :{type:Boolean} 
});

Service.initSchema(User);