var bozuko = require('bozuko')
    ;
    
/**
 * Abstract Bozuko Transfer Object
 */
var TransferObject = module.exports = function(config){
    this.doc = config.doc;
    this.def = config.def;
    this.links = {};
};

var $ = TransferObject.prototype;

$.sanitize = function(data, current){
    // make this conform to our def
    var self = this, ret = {};
    if( !current ) current = this.def;
    Object.keys( current ).forEach( function( key ){
        if( data[key] ){
            // make sure its the right type
            var v = ret[key] = data[key];
            var c = current[key];
            if( c instanceof String ){
                // check type
                switch(c.toLowerCase()){
                    
                    case 'string':
                        v = ''+v;
                        break;
                    
                    case 'int':
                    case 'integer':
                        v = parseInt(v);
                        break;
                    
                    case 'float':
                    case 'number':
                        v = parseFloat(v);
                        break;
                }
            }
            else if(c instanceof Array){
                if( !(v instanceof Array) ){
                    v = [v];
                }
                // the configuration should only have one value
                v.forEach(function(obj){
                    obj = self.sanitize(obj,c[0]);
                });
            }
            else if(c instanceof Object){
                v = self.sanitize(v, c);
            }
        }
    });
    return ret;
};



$.addLink = function(link){
    this.links[link.name] = link;
};

TransferObject.create = function(def, doc){
    return new TransferObject(def, doc);
};