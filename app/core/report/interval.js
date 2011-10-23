var Report = Bozuko.require('core/report'),
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    crypto = require('crypto'),
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
    
    if( unit === 'Week' ){
        unitInterval = 7;
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
            end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()) );
            // check to see which day of the week this falls on..
            var d = end.getDay();
            
            if( d !== 0 ){
                var i = 7-d;
                end = new Date( Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()+i+1) );
            }
            
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
            
            case 'Week':
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
    
    console.log(intervals);
    
    var reports = [];
    var addReportRecord = function(stamp, count, useCache, cacheKey, cb){
        var value = {
            _id: stamp,
            timestamp: stamp,
            count: count
        };
        reports.push(value);
        
        if( !useCache ) return cb();
        
        var cache = new Bozuko.models.Cache({
            _id: cacheKey,
            value: value
        });
        
        return cache.save(function(error){
            return cb();
        });
    };
    
    return async.forEach( intervals,
        
        function iterate(interval, cb){
            
            var stamp = new Date(+interval[0]),
                selector = {};
                
            selector[timeField] = {
                $gte        :interval[0],
                $lt         :interval[1]
            };
            
            if( unit == 'Month' || unit == 'Year'){
                stamp = new Date(Date.UTC(stamp.getUTCFullYear(), stamp.getUTCMonth(), stamp.getUTCDate()+10));
            }
            
            selector = merge( selector, query );
            
            var end = +selector[timeField].$lt-tzOffset-1000;
            var useCache = false, cacheKey='', cacheValue;
            
            if( end < Date.now() - 1000*60*60*24 ){
                
                var filter = opts.distinctFilter ? opts.distinctFilter.toString() : false;
                if( filter ) filter = crypto.createHash('sha1').update(filter).digest('hex');
                
                cacheKey = JSON.stringify({
                    opts:opts, selector:selector, distinctFilter: filter
                });
                
                cacheKey = new Buffer(cacheKey).toString('base64');
                
                // we can cache this...
                useCache = true;
                // check cache...
            }
            
            async.series([
                function try_cache(cb){
                    if( !useCache ) return cb();
                    return Bozuko.models.Cache.findById(cacheKey, function(error, result){
                        if( error ) return cb(error);
                        if( result ) cacheValue = result.value;
                        return cb(null);
                    });
                },
                function no_cache(cb){
                    if( cacheValue !== undefined && cacheValue._id ){
                        reports.push(cacheValue);
                        return cb();
                    }
                    if( opts.sumField ){
                        var fields = {};
                        fields[opts.sumField] = 1;
                        return Bozuko.models[model].find(selector, fields, function(error, results){
                            if( error ) return cb(error);
                            var count = 0;
                            results.forEach(function(result){
                                count += result[opts.sumField];
                            });
                            return addReportRecord(stamp, count, useCache, cacheKey, cb);
                        });
                    }
                    
                    else if( opts.distinctField ){
                        var fields = {};
                        fields[opts.sumField] = 1;
                        return Bozuko.models[model].collection.distinct(opts.distinctField, selector, function(error, results){
                            if( error ) return cb(error);
                            var count = results.length;
                            if( opts.distinctFilter ){
                                return opts.distinctFilter(results, opts, selector, function(error, count){
                                    if( error ) return cb(error);
                                    return addReportRecord(stamp, count, useCache, cacheKey, cb);
                                });
                            }
                            return addReportRecord(stamp, count, useCache, cacheKey, cb);
                        });
                    }
                    
                    else return Bozuko.models[model].count(selector, function(error, count){
                        if( error ) return cb(error);
                        return addReportRecord(stamp, count, useCache, cacheKey, cb);
                    });
                }
            ], function(error){
                if( error ) return cb(error);
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