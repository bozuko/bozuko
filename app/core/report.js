
var Report = module.exports = function(options){
    this.options = options||{};
};

Report.prototype.run = function(callback){
    callback(null, []);
};

Report.run = function run(type, options, callback){
    if( 'function' === typeof options ){
        callback = options;
        options = {};
    }
    var reportType = require('./report/'+type);
    var report = new reportType(options);
    return report.run(callback);
};