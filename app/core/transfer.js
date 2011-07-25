var fs              = require('fs'),
    path            = require('path'),
    async           = require('async'),
    markdown        = require('markdown-js'),
    Profiler        = require('../util/profiler')
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

TransferObject.ticks = 0;
TransferObject.tickLimit = 10;

TransferObject.prototype.getTitle = function(){
    return this.title || this.name;
};

TransferObject.prototype.create = function(data, user, callback){
    try{
        return this._create ? this._create(data, user, callback) : this.sanitize(data, null, user, callback);
    }catch(e){
        throw e;
    }
};

TransferObject.prototype.returnedBy = function(link){
    if( link && !~this.returned.indexOf(link) ) this.returned.push(link);
    return this.returned;
};

TransferObject.prototype.merge = function(a,b){
    // only do it for the properties we have
    
    Object.keys(this.def).forEach(function(prop){
        if( b[prop] ) a[prop] = b[prop];
    });
    return a;
};

var native_types = ['string', 'number', 'object', 'int', 'integer', 'mixed'];

TransferObject.now = function(fn){ return fn(); };

TransferObject.prototype.sanitize = function(data, current, user, callback){
    
    // make this conform to our def
    var self = this, ret = {};
    if( !current ) current = this.def;

    if( typeof current == 'string' ){
        // this _should be_ another transfer object
        return Bozuko.transfer(current, data, user, callback);
    }

    else if( current instanceof Array ){
        
        if( !(data instanceof Array) ){
            data = [];
        }
        
        ret = [];
        return async.forEachSeries( data,
            function iterator(item, next){
                (TransferObject.ticks++ % TransferObject.tickLimit == 0 ? async.nextTick : TransferObject.now )(function(){
                    self.sanitize(item, current[0], user, function(error, result){
                        if( error ) return next(error);
                        ret.push(result);
                        return next();
                    });
                });
            },
            function cb(error){
                if( error ) return callback( error );
                return callback(null, ret);
            }
        );
        
    }
    else{
        if( !(data instanceof Object || typeof data == 'object') ){
            data = {};
        }
        
        return async.forEachSeries( Object.keys(current),
            function iterator(key, next){
                (TransferObject.ticks++ % TransferObject.tickLimit == 0 ? async.nextTick : TransferObject.now )(function(){
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
                                case 'mixed':
                                    break;
        
                                default:
                                    return Bozuko.transfer(c, v, user, function(error, value){
                                        if( error ) return next(error);
                                        ret[key] = value;
                                        return next();
                                    });
                            }
                        }
                        else if(c instanceof Number){
                            v = parseFloat(v);
                        }
                        else if(c instanceof Object || typeof c == 'object'){
                            
                            return self.sanitize(v, c, user, function(error, value){
                                if( error ) return next(error);
                                ret[key] = value;
                                return next();
                            });
                        }
                        ret[key] = v;
                    }
                    return next();
                });
            },
            
            function cb(error){
                if( error ) return callback(error);
                return callback( null, ret );
            }
        );
    }
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
        var prof = new Profiler('/core/transfer/validate/array');
        data.forEach(function(v,k){
            if (!self.validate(v,current[0])) {
                ret = false;
            }
        });
        prof.stop();
    }
    else{
        if( !(data instanceof Object || typeof data == 'object') ){
            return false;
        }
        var prof = new Profiler('/core/transfer/validate/object');
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
        prof.stop();
    }
    return ret;
};

TransferObject.prototype.addLink = function(link){
    this.links[link.name] = link;
};

TransferObject.create = function(name, config){
    return new TransferObject(name, config);
};