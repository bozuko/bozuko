/**
 * Module Dependencies
 */
var mongoose = require('mongoose');

/**
 * Global Variables
 */
var _db;
function getConnection(){
    if( !_db){
        _db = mongoose.connect(Bozuko.config.db.host);
    }
    return _db;
}
exports.conn = function(){
    return getConnection();
};
exports.model = function(name, schema){
    if( !schema ){
        return mongoose.model(name);
    }
    else{
        mongoose.model(name, schema);
        return getConnection().model(name);
    }
};


mongoose.SchemaTypes.Array.prototype.$conditionalHandlers['$near'] = function (val) {
    return this.cast(val);
};
mongoose.SchemaTypes.Array.prototype.$conditionalHandlers['$box'] = function (val) {
    return this.cast(val);
};
mongoose.SchemaTypes.Array.prototype.$conditionalHandlers['$within'] = function (val) {
    return this.cast(val);
};