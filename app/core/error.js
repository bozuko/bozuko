// meh, don't know if we need this - just use vanilla Error

var BozukoError = function(message, data, file, line){
    this.data = data;
    Error.call(this, message, file, line);
};

BozukoError.prototype.__proto__ = Error.prototype;