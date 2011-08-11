var MongooseError   = require('mongoose').Error;

var BozukoError = module.exports = function(name,message,data,code,title){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = name;
    this.data = data;
    if( code ) this.code = code;
    if( title ) this.title = title;
    if( message instanceof Function){
        this.message = message.apply(this);
    }
    else{
        this.message = message;
    }
};

BozukoError.prototype.__proto__ = Error.prototype;
var proto = BozukoError.prototype;

Error.prototype.code = 500;
Error.prototype.name = 'default';
Error.prototype.title = 'Uh-oh!';

MongooseError.prototype.name='database';

Error.prototype.toTransfer = function(callback){
    return Bozuko.transfer('error', this, null, callback);
};

Error.prototype.send = function(res){
    
    if( this.name === 'http/timeout' && this.message.match(/graph\.facebook\.com/) ){
        this.title = 'Facebook Timemout';
        this.message = 'Facebook is taking forever! Sorry, please try again in a little bit.'
    }
    
    console.error('send '+this.name+": "+this.message);
    Bozuko.publish('error/send', {message: this.message, name:this.name, code: this.code, stack: this.stack} );
    console.error('send '+this.name+": "+this.message);
    var code = this.code;
    this.toTransfer(function(error, result){
        res.send(error || result, code);
    });
};

// sometimes the native mongo drivers return Strings instead of errors,
// so lets extend the string prototype with the "send" method
String.prototype.send = function(res){
    var error = new Error(this);
    return error.send(res);
};
