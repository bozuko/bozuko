/**
 * Module Dependencies
 */
var mongoose = require('mongoose').Mongoose;

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
exports.model = function(name, config){
    if( !config ){
        return getConnection().model(name);
    }
    else{
        mongoose.model(name, config);
        getConnection().model(name);
    }
};