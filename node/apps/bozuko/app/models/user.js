var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var User = module.exports = new Schema({
    name                :{type:String},
    first_name          :{type:String},
    last_name           :{type:String},
    gender              :{type:String},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    facebook_id         :{type:String, index: true},
    facebook_auth       :{type:String},
    can_manage_pages    :{type:Boolean}
    
});
    
    /*
// I think we can just use default instead of this
User.pre('save', function(next){
    if( this.isNew ){
        this.sign_up_date = new Date();
    }
    next();
});
    */