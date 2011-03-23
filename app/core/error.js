var bozuko          = require('bozuko'),
    MongooseError   = require('mongoose').Error;

var BozukoError = module.exports = function(name,message,data,code){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.data = data;
    if( code ) this.code = code;
    if( message instanceof Function)
        this.generateMesesage();
    else
        this.message = message;
};

BozukoError.prototype.__proto__ = Error.prototype;
var proto = BozukoError.prototype;

Error.prototype.code = 500;
Error.prototype.name = 'default';

MongooseError.prototype.name='database';

Error.prototype.toTransfer = function(){
    return bozuko.transfer('error', this);
};

proto.generateMessage = function(fn){
    this.message = fn.apply(this);
};

Error.prototype.send = function(res){
    return res.send( this.toTransfer(), this.code );
};
