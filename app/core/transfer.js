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

var $ = TransferObject.prototype;

$.getTitle = function(){
    return this.title || this.name;
};

$.create = function(data){
    return this._create ? this._create(data) : this.sanitize(data);
};

$.returnedBy = function(link){
    if( link && !~this.returned.indexOf(link) ) this.returned.push(link);
    return this.returned;
};

$.merge = function(a,b){
    a = this.sanitize(a);
    b = this.sanitize(b);
    Object.keys(b).forEach(function(prop){
        a[prop] = b[prop];
    });
    return a;
};

$.sanitize = function(data, current){

    // make this conform to our def
    var self = this, ret = {};
    if( !current ) current = this.def;
    
    if( typeof current == 'string' ){
        // this _should be_ another transfer object
        ret = data ? Bozuko.transfer(current, data) : null;
    }

    else if( current instanceof Array ){
        ret = [];
        if( !(data instanceof Array) ){
            data = [];
        }
        data.forEach(function(v,k){
            ret[k] = self.sanitize(v,current[0]);
        });
    }
    else{
        if( !(data instanceof Object || typeof data == 'object') ){
            data = {};
        }
        Object.keys(current).forEach(function(key){
            if( data[key] ){
                // Cast the value to the proper type.
                var v = data[key];
                var c = current[key];

                if( c instanceof String || typeof c == 'string' ){
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
                    ret[key] = v;
                }
                else if(c instanceof Number ){
                    v = parseFloat(v);
                }
                else if(c instanceof Object || typeof c == 'object'){
                    ret[key] = self.sanitize(v,c);
                }
            }
        });
    }
    return ret;
};

// This only validates that properties that exist in data are of the right type.
// We should have some way to validate whether all required properties exist.
$.validate = function(data, current) {

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
                if (typeof c != 'string') {
                    if (!self.validate(v, c)) {
                        ret = false;
                    }
                } else if (c.toLowerCase() != typeof v ) {
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

$.addLink = function(link){
    this.links[link.name] = link;
};

TransferObject.create = function(name, config){
    return new TransferObject(name, config);
};