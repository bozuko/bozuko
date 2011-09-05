/**
 * Module Dependencies
 */
var mongoose = require('mongoose');

/**
 * Global Variables
 */
var _db;

function getConnection(){
    var uri;
    if( !_db){
        mongoose.connection.on('opening', function() {
            console.log("Mongoose opening "+uri);
        });
        mongoose.connection.on('close', function() {
            console.error("Mongoose closed connection to "+uri);
        });
        mongoose.connection.on('open', function() {
            console.log("Mongoose connected to "+uri);
        });
        mongoose.connection.on('error', function(err) {
            console.error("Mongoose connection error: "+err);
        });
        if (Bozuko.config.db.replicaSet) {
            var str = '';
            for (var i = 0; i < Bozuko.config.db.hosts.length; i++) {
                str += 'mongodb://'+Bozuko.config.db.hosts[i]+'/'+Bozuko.config.db.name;
                if (i != Bozuko.config.db.hosts.length - 1) {
                    str+=",";
                }
            };
			uri = str;
            _db = mongoose.connectSet(str, Bozuko.config.db.options);
        } else {
            uri = 'mongodb://'+Bozuko.config.db.host+'/'+Bozuko.config.db.name;
            _db = mongoose.connect(uri, Bozuko.config.db.options);
        }
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
