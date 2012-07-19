var MongooseError   = require('mongoose').Error;

var BozukoError = module.exports = function(name,message,data,code,title){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = name;
    this.data = data;
    this._errors = {};
    if( code ) this.code = code;
    if( title ) this.title = title;
    if( message instanceof Function){
        this.message = message.apply(this);
    }
    else{
        this.message = message;
    }
};

BozukoError.prototype.errors = function(val){
    if(val != undefined){
        if(!val) delete this._errors;
        else for(var i in val) if( val.hasOwnProperty(i) ){
            this.error(i, val[i]);
        }
        return this;
    }
    return this._errors;
};

BozukoError.prototype.error = function(name, val){
    if(val != undefined){
        if(!val) delete this._errors[name];
        else this._errors[name] = val;
        return this;
    }
    return this._errors[name];
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
        this.title = 'Facebook Timeout';
        this.message = 'Facebook is taking forever! Sorry, please try again in a little bit.';
    }

    if (this.name === 'MongoError') {
        return Bozuko.error('maintenance/generic').send(res);
    }
    
    console.error('send '+this.name+": "+this.message+"\n"+this.stack);
    Bozuko.publish('error/send', {message: this.message, name:this.name, code: this.code, stack: this.stack} );
    var code = this.code;
    this.toTransfer(function(error, result){
        res.send(error || result, code);
    });
};

// sometimes the native mongo drivers return Strings instead of errors,
// so lets extend the string prototype with the "send" method
String.prototype.send = function(res){
    Bozuko.error('maintenance/generic').send(res);
};
