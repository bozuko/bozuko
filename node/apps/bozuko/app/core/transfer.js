var bozuko = require('bozuko')
    ;
    
/**
 * Abstract Bozuko Transfer Object
 */
var TransferObject = module.exports = function(name, config){
    this.name = name;
    this.doc = config.doc;
    this.def = config.def;
    this.title = config.title;
    this.links = {};
    this.returned = [];
    
    // run through the links and associate with this controller
    if( this.def.links ){
        var self = this;
        Object.keys(this.def.links).forEach(function(key){
            
            if( bozuko.link(key) ){
                bozuko.link(key).associateTransferObject(self);
            }
            else{
                console.log('Undocumented Link ['+key+']');
            }
        });
        
    }
};

var $ = TransferObject.prototype;

$.getTitle = function(){
    return this.title || this.name;
};

$.returnedBy = function(link){
    if( link && !~this.returned.indexOf(link) ) this.returned.push(link);
    return this.returned;
}

$.sanitize = function(data, current){
    // make this conform to our def
    var self = this, ret = {};
    if( !current ) current = this.def;
    
    if( current instanceof Array ){
        if( !(data instanceof Array) ){
            ret = [];
        }
        data.forEach(function(v,k){
            data[k] = self.sanitize(v,current[0]);
        });
    }
    else if( current instanceof Object ){
        if( !(data instanceof Object) ){
            data = {};
        }
        else Object.keys(current).forEach(function(key){
             if( data[key] ){
                // Cast the value to the proper type.
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
                else if(c instanceof Object){
                    ret[key] = self.sanitize(v,c);
                }
            }
        });
    }
    return ret;
};

$.addLink = function(link){
    this.links[link.name] = link;
};

TransferObject.create = function(name, config){
    return new TransferObject(name, config);
};