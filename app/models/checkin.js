var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Checkin = module.exports = new Schema({
    user_id                 :{type:ObjectId},
    page_id                 :{type:ObjectId},
    timestamp               :{type:Date, default: Date.now},
    lat                     :{type:Number},
    lng                     :{type:Number},
    description             :{type:String},
    message                 :{type:String},
    service                 :{type:String}
});

Checkin.static('process', function(user, page, options, callback){
    if( !user ){
        return callback( bozuko.error('callback/no_user'));
    }
    if( !page ){
        return callback( bozuko.error('callback/no_page'));
    }
    if( options.service ){
        
    }
});