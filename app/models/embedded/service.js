var bozuko = require('bozuko'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema
    ;

var Service = module.exports = new Schema({
    name                :{type:String},
    sid                 :{type:String},
    auth                :{type:String},
    data                :{}
});

Service.initSchema = function(schema){
    
    schema.add({
        'services': [Service]
    });
    
    schema.method('service', function(name){
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
        service.sid = arguments[1];
        if( arguments[2] ) service.auth = arguments[2];
        if( arguments[3] ) service.data = arguments[3];
        if( add ){
            serivce = this.services.push(service);
        }
        return service;
    });
    
    schema.static('findByService', function(name, id, callback){
        this.findOne({'services.name':name,'services.sid':id}, callback);
    });
    
    schema.index({'services.name':1,'services.sid':1});
};