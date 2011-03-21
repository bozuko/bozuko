var bozuko = require('bozuko'),
    TransferObject = bozuko.require('core/transfer')
    ;

var HttpMethod = function(method, config, link){
    this.method = method;
    this.doc = config.doc;
    this.params = config.params;
    this.returns = config.returns;
    this.link = link;
};

/**
 * Abstract Bozuko Link Object
 */
var Link = module.exports = function(name, config){
    this.name = name;
    this.transferObjects = [];
    this.methods = {};
    this.title = config.title;
    
    var self = this;
    
    Object.keys(config).forEach(function(method){
        self.addMethod(new HttpMethod(method, config[method], this));
    });
};

var $ = Link.prototype;

$.getTitle = function(){
    return this.title || this.name;
};

$.addMethod = function(httpMethod){
    this.methods[httpMethod.method] = httpMethod;
};

$.associateTransferObject = function(transferObject){
    this.transferObjects.push(transferObject);
};

Link.create = function(name, config){
    return new Link(name, config);
};