var Report = Bozuko.require('core/report'),
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    merge = Bozuko.require('util/functions').merge,
    DateUtil = Bozuko.require('util/date')
    ;
    
var CountsReport = module.exports = function(options){
    Report.apply(this, arguments);
    if( options.field ){
        this.options.groupField = options.field;
    }
};
inherits( CountsReport, Report );

/**
 * Options:
 *  groupField
 *  type
 *  modelName
 *  to
 *  from
 *  interval
 *  query
 *
 */
CountsReport.prototype.run = function run(callback){
    
    var self = this,
        modelName = this.options.model || 'Entry';
    
    if( !Bozuko.models[modelName] ) throw Bozuko.error('report/counts/no_model');
    
    var type = self.options.type || 'time',
        groupField = self.options.groupField || (type=='time' ? 'timestamp' : false);
    
    if( !groupField ) throw Bozuko.error('report/counts/no_field');
    
    // get the
    
    
};