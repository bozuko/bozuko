var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    
var Service = new Schema({
    name                :{type:String},
    id                  :{type:String},
    auth                :{type:String},
    data                :{}
});

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

User.index({'services.name':1,'services.id':1});

User.method('service', function(name){
    var service = false;
    for(var i=0; i<this.services.length && !service; i++){
        if( name == this.services[i].name ) service = this.services[i];
    }
    if( !arguments[1] ) return service;
    var add = false;
    if( !service ){
        add = true;
        service = {name:name};
    }
    service.id = arguments[1];
    if( arguments[2] ) service.auth = arguments[2];
    if( arguments[3] ) service.data = arguments[3];
    if( add ){
        serivce = this.services[this.services.length] = service;
    }
    return service;
});