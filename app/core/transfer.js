var fs              = require('fs'),
    path            = require('path'),
    markdown        = require('markdown-js')
    ;

/**
 * Abstract Bozuko Transfer Object
 */
var TransferObject = module.exports = function(name, config){
    this.name = name;
    this.doc = config.doc;
    this.def = config.def;
    this.access = config.access || false;
    this._create = config.create;
    this.title = config.title;
    this.links = {};
    this.returned = [];
    
    // check for .md documentation
    var filename = Bozuko.dir+'/content/docs/api/transfers/'+this.name+'.md';
    if( path.existsSync(filename) ){
        this.doc = markdown.parse( fs.readFileSync(filename, 'utf-8'));
    }

    // run through the links and associate with this controller
    if( this.def.links ){
        var self = this;
        Object.keys(this.def.links).forEach(function(key){

            if( Bozuko.link(key) ){
                Bozuko.link(key).associateTransferObject(self);
            }
            else{
                console.warn('Undocumented Link ['+key+']');
            }
        });
    }
};

TransferObject.prototype.getTitle = function(){
    return this.title || this.name;
};

TransferObject.prototype.create = function(data, user){
    try{
        return this._create ? this._create(data, user) : this.sanitize(data, null, user);
    }catch(e){
        throw e;
    }
};

TransferObject.prototype.returnedBy = function(link){
    if( link && !~this.returned.indexOf(link) ) this.returned.push(link);
    return this.returned;
};

TransferObject.prototype.merge = function(a,b){
    a = this.sanitize(a);
    b = this.sanitize(b);
    Object.keys(b).forEach(function(prop){
        a[prop] = b[prop];
    });
    return a;
};

var native_types = ['string', 'number', 'object', 'int', 'integer'];

TransferObject.prototype.sanitize = function(data, current, user){

    // make this conform to our def
    var self = this, ret = {};
    if( !current ) current = this.def;
    
    if( typeof current == 'string' ){
        // this _should be_ another transfer object
        ret = data ? Bozuko.transfer(current, data, user) : null;
    }

    else if( current instanceof Array ){
        ret = [];
        if( !(data instanceof Array) ){
            data = [];
        }
        data.forEach(function(v,k){
            ret[k] = self.sanitize(v,current[0],user);
        });
    }
    else{
        if( !(data instanceof Object || typeof data == 'object') ){
            data = {};
        }
        Object.keys(current).forEach(function(key){
            if( data[key] !== undefined ){
                // Cast the value to the proper type.
                var v = data[key];
                var c = current[key];

                if( c instanceof String || typeof c == 'string' ){
                    // check type

                    switch(c.toLowerCase()){

                        case 'string':
                            v = String(v);
                            break;

                        case 'int':
                        case 'integer':
                            v = parseInt(v);
                            break;

                        case 'float':
                        case 'number':
                            v = parseFloat(v);
                            break;
                        
                        case 'boolean':
                            v = Boolean(v);
                            break;
                        
                        case 'object':
                            break;
                        
                        default:
                            v  = Bozuko.transfer(c, v, user);

                    }
                    ret[key] = v;
                }
                else if(c instanceof Number ){
                    v = parseFloat(v);
                }
                else if(c instanceof Object || typeof c == 'object'){
                    ret[key] = self.sanitize(v,c,user);
                }
            }
        });
    }
    return ret;
};

// This only validates that properties that exist in data are of the right type.
// We should have some way to validate whether all required properties exist.
TransferObject.prototype.validate = function(data, current) {

    var self = this, ret = true;
    if( !current ) current = this.def;
    
    
    if( typeof current == 'string' ){
        // this _should be_ another transfer object
        ret = Bozuko.validate(current, data);
    }

    else if( current instanceof Array ){
        if( !(data instanceof Array) ){
            return false;
        }
        data.forEach(function(v,k){
            if (!self.validate(v,current[0])) {
                ret = false;
            }
        });
    }
    else{
        if( !(data instanceof Object || typeof data == 'object') ){
            return false;
        }
        Object.keys(current).forEach(function(key){
            if( data[key] ){
                var v = data[key];
                var c = current[key];
                
                if (typeof c != 'string' ) {
                    if (!self.validate(v, c)) {
                        ret = false;
                    }
                }
                else if( typeof v == 'object' && !~native_types.indexOf(c.toLowerCase())){
                    ret = Bozuko.validate(c, v);
                }
                else if( c.toLowerCase() != typeof v ) {
                    console.log("failed key = "+key);
                    console.log("typeof c = "+typeof c);
                    console.log("typeof v = "+typeof v);
                    ret = false;
                } 
            }
        });
    }
    return ret;
};

TransferObject.prototype.addLink = function(link){
    this.links[link.name] = link;
};

TransferObject.create = function(name, config){
    return new TransferObject(name, config);
};