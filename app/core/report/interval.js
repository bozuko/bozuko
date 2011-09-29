var Report = Bozuko.require('core/report'),
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    async = require('async'),
    merge = Bozuko.require('util/functions').merge,
    DateUtil = Bozuko.require('util/date')
    ;
    
var CountsReport = module.exports = function(options){
    Report.apply(this, arguments);
};
inherits( CountsReport, Report );

/**
 * Options:
 *
 *  end             Date
 *  interval        'Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'
 *  length          Number
 *  unit            'Second', 'Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'
 * 
 */
CountsReport.prototype.run = function run(callback){
    
    var opts = this.options,
        interval = opts.interval,
        unit = opts.unit,
        unitInterval = opts.unitInterval || 1,
        timeField = opts.timeField || 'timestamp',
        query = opts.query || {},
        model = opts.model || 'Entry',
        end = opts.end || new Date(),
        start, length = opts.length || 1;
        tzOffset = (opts.timezoneOffset||0)*1000*60;
        
    if( !Bozuko.models[model] ) return callback( new Error("Invalid Model") );
    
    if(tzOffset){
        end = new Date(end.getTime() - tzOffset);
    }
    
    switch( interval ){
        
        case 'Year':
            end = new Date( Date.UTC(parseInt(end.getUTCFullYear(),10)+1,0,1) );
            start = new Date( Date.UTC(parseInt(end.getUTCFullYear(),10)-length,0,1) );
            break;
            
        case 'Month':
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,1) );
            start = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-length,1) );
            break;
        
        case 'Week':
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()+1) );
            start = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()-(length*7)) );
            break;
        
        case 'Day':
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()+1) );
            start = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()-length) );
            break;
            
        case 'Hour':
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),end.getUTCHours()+1) );
            start = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),end.getUTCHours()-length) );
            break;
        
        case 'Minute':
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),end.getUTCHours(), end.getUTCMinutes()+1) );
            start = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),end.getUTCHours(),end.getUTCMinutes()-length) );
            break;
        
        case 'Second':
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),end.getUTCHours(), end.getUTCMinutes(), end.getUTCSeconds()+1) );
            start = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),end.getUTCHours(),end.getUTCMinutes(), end.getUTCSeconds()-length) );
            break;
        
        default:
            return callback( new Error("Invalid interval ["+interval+"]") );
    }
    
    if( +start >= +end ) return callback( new Error("Invalid Interval") );
    
    var step, intervals=[];
    while( start < end ){
        switch( unit ){
            
            case 'Year':
                step = new Date( Date.UTC(parseInt(start.getUTCFullYear(),10)+unitInterval,0,1) );
                break;
            
            case 'Month':
                step = new Date( Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+unitInterval,1) );
                break;
                
            case 'Day':
                step = new Date( Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate()+unitInterval) );
                break;
                
            case 'Hour':
                step = new Date( Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate(),start.getUTCHours()+unitInterval) );
                break;
            
            case 'Minute':
                step = new Date( Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate(),start.getUTCHours(), start.getUTCMinutes()+unitInterval) );
                break;
            
            case 'Second':
                step = new Date( Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate(),start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds()+unitInterval) );
                break;
        }
        intervals.push([new Date(+start+tzOffset+1000), new Date(+step+tzOffset+1000)]);
        start = step;
    }
    
    var reports = [];
    
    return async.forEach( intervals,
        
        function iterate(interval, cb){
            
            var stamp = new Date(+interval[0]),
                selector = {};
                
            selector[timeField] = {
                $gte        :interval[0],
                $lt         :interval[1]
            };
            
            if( unit == 'Month' ){
                stamp = new Date(Date.UTC(stamp.getUTCFullYear(), stamp.getUTCMonth(), stamp.getUTCDate()+10));
            }
            
            selector = merge( selector, query );
            
            if( opts.sumField ){
                var fields = {};
                fields[opts.sumField] = 1;
                Bozuko.models[model].find(selector, fields, function(error, results){
                    if( error ) return cb(error);
                    var count = 0;
                    results.forEach(function(result){
                        count += result[opts.sumField];
                    });
                    reports.push({
                        _id: interval[0].getTime(),
                        timestamp: stamp,
                        count: count
                    });
                    return cb();
                });
            }
            
            else if( opts.distinctField ){
                var fields = {};
                fields[opts.sumField] = 1;
                Bozuko.models[model].collection.distinct(opts.distinctField, selector, function(error, results){
                    if( error ) return cb(error);
                    var count = results.length;
                    if( opts.distinctFilter ){
                        return opts.distinctFilter(results, opts, selector, function(error, count){
                            if( error ) return cb(error);
                            reports.push({
                                _id: interval[0].getTime(),
                                timestamp: stamp,
                                count: count
                            });
                            return cb();
                        });
                    }
                    reports.push({
                        _id: interval[0].getTime(),
                        timestamp: stamp,
                        count: count
                    });
                    return cb();
                });
            }
            
            else Bozuko.models[model].count(selector, function(error, count){
                if( error ) return cb(error);
                reports.push({
                    _id: interval[0].getTime(),
                    timestamp: stamp,
                    count: count
                });
                return cb();
            });
        },
        
        function complete(error){
            // sort by timestamp
            if( error ) return callback( error );
            reports.sort(function(a,b){return a.timestamp-b.timestamp;});
            return callback(null, reports);
        }
    );
    
};