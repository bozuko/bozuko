var async = require('async'),
    TransferObject = require('./transferObject'),
    Link = require('./link'),
    fs = require('fs')
;

var transfer_objects = {};
var links = {};

var transfer = module.exports = function(key, data, user, callback) {
    if( !data ) return transfer_objects[key];
    try{
        if( Array.isArray(data) ){
            var ret = [];
	    return async.forEachSeries( data,
	        function iterator(o, next){
		    return transfer_objects[key].create(o, user, function( error, result){
			if( error ) return next(error);
			ret.push(result);
			return next();
		    });
		},

	        function cb(error){
		    if( error ) return callback( error );
		    return callback( null, ret );
		}
	    );
        }
        else{
            return transfer_objects[key].create(data, user, function(error, result){
		if( error ) return callback( error );
		return callback( null, result );
	    });
        }
    }catch(e){
        return callback(e);
    }

};
transfer.objects = transfer_objects;
transfer.links = links;

transfer.init = function(opts) {
    var files = [];
    fs.readdirSync(__dirname + '/transfers').forEach( function(file){

        if( !/js$/.test(file) ) return;

        var name = file.replace(/\..*?$/, '');
        // first check for object_types and links
        files.push(require('./transfers/'+name));
    });

    // collect all the links first so they can be associated in the Transfer Objects
    files.forEach(function(file){
        if(file.links) {
            Object.keys(file.links).forEach(function(key) {
                var config = file.links[key];
                config.docs_dir = opts.docs_dir;
                transfer.links[key] = Link.create(key, config);
            });
        }
    });
    files.forEach(function(file){
        if(file.transfer_objects) {
            Object.keys(file.transfer_objects).forEach(function(key){
                var config = file.transfer_objects[key];
                config.docs_dir = opts.docs_dir;
                transfer.objects[key] = TransferObject.create(key, config);
            });
        }
    });

    // okay, one last time through the links to associate
    // the return objects
    Object.keys(transfer.links).forEach(function(key){
        var link = transfer.links[key];
        Object.keys(link.methods).forEach(function(name){
            var method = link.methods[name];
            var r = method.returns;
            if( r instanceof Array ){
                r = r[0];
            }
            var t = transfer(r);
            if( t ) t.returnedBy(link);
        });
    });
}

