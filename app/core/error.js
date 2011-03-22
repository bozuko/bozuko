var bozuko          = require('bozuko'),
    MongooseError   = require('Mongoose').Error;

var BozukoError = module.exports = function(name,message,data){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'default';
    this.data = data;
    if( message instanceof Function)
        this.generateMesesage();
    else
        this.message = message;
};

var proto = BozukoError.prototype.__proto__ = Error.prototype;

proto.toTransfer = function(){
    return bozuko.transfer('error', this);
};

proto.generateMessage = function(fn){
    this.message = fn.apply(this);
}

MongooseError.prototype.toTransfer = function(){
    this.name = 'mongoose';
    return proto.toTransfer.apply(this);
}