var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    merge = require('connect').utils.merge
    ;

var LastUpdatedPlugin = module.exports = function(schema, opts){
    
    schema.add({
        'last_updated': {type:Date, default: Date.now, index: true}
    });
    
    schema.pre('save', function(next){
        this.last_updated = new Date();
        next();
    });
    
};