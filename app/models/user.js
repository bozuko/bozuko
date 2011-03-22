var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Services = require('./embedded/service')
    ;

var User = module.exports = new Schema({
    name                :{type:String},
    first_name          :{type:String},
    last_name           :{type:String},
    gender              :{type:String},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    favorites           :[ObjectId],
    can_manage_pages    :{type:Boolean} 
});

Services.initSchema(User);

// also, lets check what the hell services looks like prior to saving..
User.pre('save', function(next){
    console.log('before save', this.services.length);
    next();
});
User.post('save', function(){
    console.log('after save', this.services.length);
});
