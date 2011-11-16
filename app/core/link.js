var TransferObject  = require('./transferObject'),
    fs              = require('fs'),
    path            = require('path'),
    markdown        = require('markdown-js')
    ;

var HttpMethod = function(method, config, link){
    this.method = method;
    this.access = config.access || false;
    this.params = config.params;
    this.returns = config.returns;
    this.docs_dir = config.docs_dir;
    this.link = link;
    this.doc = config.doc;
    // check for .md documentation
    var filename = this.docs_dir+'/links/'+this.link.name+'/'+this.method+'.md';
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

Link.prototype.getTitle = function(){
    return this.title || this.name;
};

Link.prototype.addMethod = function(httpMethod){
    this.methods[httpMethod.method] = httpMethod;
};

Link.prototype.associateTransferObject = function(transferObject){
    this.transferObjects.push(transferObject);
};

Link.create = function(name, config){
    return new Link(name, config);
};
