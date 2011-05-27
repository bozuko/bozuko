

var Json = module.exports = function(schema, options){
    // include virtuals in the "toJSON" method
    
    schema.method('toJSON', function(){
        var self = this;
        // get the object
        var object = this.toObject();
        // go through the virtuals
        Object.keys(this.schema.virtuals||{}).forEach(function(key){
            var parts = key.split('.');
            if( parts.length > 1) return;
            object[key] = self[key];
        });
        return object;
    });
    
}