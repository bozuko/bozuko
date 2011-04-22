var TransferObject  = Bozuko.require('core/transfer'),
    fs              = require('fs'),
    path            = require('path'),
    markdown        = require('markdown-js')
    ;

var HttpMethod = function(method, config, link){
    this.method = method;
    this.access = config.access || false;
    this.params = config.params;
    this.returns = config.returns;
    this.link = link;
    this.doc = config.doc;
    // check for .md documentation
    var filename = Bozuko.dir+'/content/docs/api/links/'+this.link.name+'/'+this.method+'.md';
    if( path.existsSync(filename)){
        this.doc = markdown.parse( fs.readFileSync(filename, 'utf-8'));
    }
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
        self.addMethod(new HttpMethod(method, config[method], self));
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