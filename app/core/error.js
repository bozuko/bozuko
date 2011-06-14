var MongooseError   = require('mongoose').Error;

var BozukoError = module.exports = function(name,message,data,code){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = name;
    this.data = data;
    if( code ) this.code = code;
    if( message instanceof Function)
        this.generateMessage(message);
    else
        this.message = message;
};

BozukoError.prototype.__proto__ = Error.prototype;
var proto = BozukoError.prototype;

Error.prototype.code = 500;
Error.prototype.name = 'default';

MongooseError.prototype.name='database';

Error.prototype.toTransfer = function(){
    return Bozuko.transfer('error', this);
};

proto.generateMessage = function(fn){
    this.message = fn.apply(this);
};

Error.prototype.send = function(res){
    Bozuko.publish('error/send', this);
    return res.send( this.toTransfer(), this.code );
};

// sometimes the native mongo drivers return Strings instead of errors,
// so lets extend the string prototype with the "send" method
String.prototype.send = function(res){
    var error = new Error(this);
    return error.send(res);
}