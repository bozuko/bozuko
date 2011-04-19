var mongoose = require('mongoose'),
    Schema = mongoose.Schema
    ;

var CoordsPlugin = module.exports = function(schema, opts){
    
    schema.add({
        'coords': Array
    });
    schema.index({'coords':'2d'});
    
    schema.virtual('latitude', function(){
        return this.coords ? this.coords[1] : null;
    });
    schema.virtual('longitude', function(){
        return this.coords ? this.coords[0] : null;
    });
    schema.virtual('location.lat', function(){
        return this.coords ? this.coords[1] : null;
    });
    schema.virtual('location.lng', function(){
        return this.coords ? this.coords[0] : null;
    });
};