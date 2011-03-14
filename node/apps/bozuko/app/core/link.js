var bozuko = require('bozuko'),
    Return = bozuko.require('return')
    ;

var HttpMethod = function(method, config, link){
    this.method = method;
    this.def = config.def;
    this.doc = config.doc;
    this.link = link;
};

/**
 * Abstract Bozuko Returnable Object
 */
var Link = module.exports = function(config){
    // loop through the methods...
    var self = this;
    this.transferObjects = [];
    this.methods = {};
    Object.keys(config).forEach(function(name){
        self.addMethod(new HttpMethod(name, config, this));
    });
    this.objects = [];
};

var $ = Link.prototype;

$.addMethod = function(httpMethod){
    this.methods[httpMethod.method] = httpMethod;
};

$.associateTransferObject = function(transferObject){
    this.transferObjects.push(transferObject);
};

Link.create = function(config){
    return new Link(config);
};