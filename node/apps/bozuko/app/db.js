var bozuko = require('bozuko');

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
        _db = mongoose.connect(bozuko.config.db.host);
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