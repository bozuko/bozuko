var mongoose = require('mongoose'),
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

User.static('createFromServiceObject', function(user, callback){
    var id = user.id;
    var service = user.service;
    var data = user.data;
    delete user.data;
    delete user.id;
    delete user.service;
    var u = new Bozuko.models.User();
    Object.keys(user).forEach(function(prop){
        u.set(prop, user[prop]);
    });
    u.service( service, id, null, data);
    u.save( function(error){
        if( error ){
            return callback( error );
        }
        return Bozuko.models.User.findById(u.id, callback);
    });
});