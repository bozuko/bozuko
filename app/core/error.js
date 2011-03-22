var bozuko          = require('bozuko'),
    MongooseError   = require('mongoose').Error;

var BozukoError = module.exports = function(name,message,data,code){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'default';
    this.data = data;
    if( code ) this.code = code;
    if( message instanceof Function)
        this.generateMesesage();
    else
        this.message = message;
};

var proto = BozukoError.prototype.__proto__ = Error.prototype;
MongooseError.prototype.code = 500;
proto.code = 500;

proto.toTransfer = function(){
    return bozuko.transfer('error', this);
};

proto.generateMessage = function(fn){
    this.message = fn.apply(this);
};

proto.send = function(res){
    return res.send( this.toTransfer(), this.code );
};

MongooseError.prototype.toTransfer = function(){
    this.name = 'mongoose';
    return proto.toTransfer.apply(this);
};
