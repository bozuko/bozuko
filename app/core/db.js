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
        var uri = 'mongodb://'+Bozuko.config.db.host+'/'+Bozuko.config.db.name+
            '/?connect=replicaSet;safe=true;w=2;wtimeout=5000;fsync=true';
        mongoose.connection.on('opening', function() {
            console.log("Mongoose opening "+uri);
        });
        mongoose.connection.on('close', function() {
            console.log("Mongoose closed connection to "+uri);
        });
        mongoose.connection.on('open', function() {
            console.log("Mongoose connected to "+uri);
        });
        mongoose.connection.on('error', function(err) {
            console.log("Mongoose connection error: "+err);
        });
        _db = mongoose.connect(uri);
        console.log('db uri = '+uri);
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
mongoose.SchemaTypes.Array.prototype.$conditionalHandlers['$nearSphere'] = function (val) {
    return this.cast(val);
};
