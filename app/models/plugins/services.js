var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    merge = require('connect').utils.merge
    ;

var Service = new Schema({
    name                :{type:String, index: true},
    sid                 :{type:String, index: true},
    auth                :{type:String},
    data                :{},
    internal            :{}
});

var ServicesPlugin = module.exports = function(schema, opts){
    
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
    
    schema.static('findByService', function(name, id, conditions, callback){
        // what is id
        var fn = Array.isArray(id) ? 'find' : 'findOne';
        var params = {'services.name':name,'services.sid': (fn=='find' ? {$in:id} : id)};
        if( !callback ){
            callback = conditions;
            conditions = null;
        }
        if( conditions ){
            merge(params, conditions);
        }
        console.log(params);
        return this[fn](params, callback);
    });
    
    schema.index({'services.name':1,'services.sid':1});
};