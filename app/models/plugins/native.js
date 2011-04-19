
/**
 * mongo find using the database driver. The callback is always the last argument.
 *
 * BE CAREFUL when creating the 'selector' parameter as variables will _not_ be cast
 * to the type defined in the mongoose Schema, so it must be done manually.
 *
 * This is needed for performing "within" searches as I do not see how it is done
 * within mongoose right now.
 *
 * Various argument possibilities
 * 1 callback
 * 2 selector, callback,
 * 3 selector, fields, callback
 * 3 selector, options, callback
 * 4,selector, fields, options, callback
 * 5 selector, fields, skip, limit, callback
 * 6 selector, fields, skip, limit, timeout, callback
 *
 * Available options:
 * limit, sort, fields, skip, hint, explain, snapshot, timeout, tailable, batchSize
 */
var NativePlugin = module.exports = function NativePlugin(schema, options){
    
    schema.static('nativeFind', function(){
        var self = this;
        var coll = this.collection;
        var cb = arguments[arguments.length-1];
        arguments[arguments.length-1] = function(error, cursor){
    
            // we are going to change this to model objects...
            if( error ){
                return cb(error);
            }
            // convert to model objects
            var pages = [];
            return cursor.toArray( function (err, docs) {
                if (err) return cb(err);
                for (var i = 0; i < docs.length; i++) {
                    pages[i] = new self();
                    pages[i].init(docs[i], function (err) {
                        if (err) return cb(err);
                        return true;
                    });
                }
                return cb(null, pages);
            });
        }
        coll.find.apply(coll, arguments);
    });
};