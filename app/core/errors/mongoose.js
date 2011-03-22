var bozuko      = require('bozuko'),
    BozukoError = bozuko.require('core/error')
    ;

var MongooseError = module.exports = function(error){
    BozukoError.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'mongoose';
    this.message = error.message;
    this.data = error;
};

var proto = MongooseError.prototype.__proto__ = BozukoError.prototype;