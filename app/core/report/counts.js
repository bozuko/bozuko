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

var pad = function(n){ return ( n < 10 ) ? '0'+n : n; };

CountsReport.prototype.mapFunctionTmpl = {
    
    time: (function(){
        var pad = function(n){ return ( n < 10 ) ? '0'+n : n; };
        var ts = this.FIELDNAME,
            offsetTime = new Date(ts.getTime() + OFFSET),
            timestamp = Date.UTC(offsetTime.getUTCFullYear(), '%0%', '%0%', '%12%', '%0%', '%0%', '%0%'),
            d = new Date(timestamp),
            _id = [
                pad(d.getUTCFullYear()),
                pad(d.getUTCMonth()),
                pad(d.getUTCDate()),
                pad(d.getUTCHours()),
                pad(d.getUTCMinutes()),
                pad(d.getUTCSeconds()),
                pad(d.getUTCMilliseconds())
            ].join(':');
        emit( _id, {timestamp: ts, count: COUNTFIELD} );
    }).toString(),
    
    filter: (function(){
        var value = this.FIELDNAME
        emit( value, {FIELDNAME: value, count: 1});
    }).toString()
};

CountsReport.prototype.getMapFunction = function getMapFunction(){
    
    var fn = this.mapFunctionTmpl[this.options.type||'time']
        .replace(/FIELDNAME/g, this.options.groupField || 'timestamp' )
        .replace(/COUNTFIELD/g, this.options.countField ? 'this.'+this.options.countField: '1')
        .replace(/OFFSET/g, (this.options.timezoneOffset && ~['Month','Date'].indexOf(this.options.interval)) ? (this.options.timezoneOffset*1000*60*60) : '0')
        ;
    
    if( this.options.type == 'filter') return fn;
    
    var intervals = ['Month','Date','Hours','Minutes','Seconds','Milliseconds'];
    
    // replace zeros
    var index = intervals.indexOf(this.options.interval || 'Date');
    if( ~index ){
        for(var i = 0; i < index+1; i++ ){
            str = 'offsetTime.getUTC'+intervals[i]+'()';
            fn = fn.replace(/'%([^%]+)%'/, str);
        }
    }
    fn = fn.replace(/'%([^%]+)%'/g, '$1');
    return fn;
};

CountsReport.prototype.getReduceFunction = function getReduceFunction(){
    return (function(key, values){
        var count = 0;
        values.forEach( function(value){
            count += value.count;
        });
        var ret = {};
        ret.FIELDNAME = values[0].FIELDNAME;
        ret.count = count;
        return ret;
    }).toString().replace( /FIELDNAME/g, this.options.groupField || 'timestamp' );
};

CountsReport.prototype.run = function run(callback){
    
    var self = this,
        modelName = this.options.model || 'Entry';
    
    if( !Bozuko.models[modelName] ) throw Bozuko.error('report/counts/no_model');
    
    var type = self.options.type || 'time',
        groupField = self.options.groupField || (type=='time' ? 'timestamp' : false);
    
    if( !groupField ) throw Bozuko.error('report/counts/no_field');
    
    var mapFn = self.options.mapFn || self.getMapFunction(),
        reduceFn = self.options.reduceFn || self.getReduceFunction();
    
    var options = {};
    if( this.options.query ){
        options.query = this.options.query;
    }
    if( type=='time' ){
        if( !options.query ) options.query = {};
        if( !options.query[groupField] ) options.query[groupField] = {};
        if( this.options.from ){
            options.query[groupField].$gt = this.options.from;
        }
        options.query[groupField].$lt = this.options.to || new Date();
    }
    
    options.out = this.options.out || {inline: 1};
    ['sort','limit','finalize','verbose','keeptemp'].forEach(function(name){
        if( self.options[name] ) options[name] = self.options[name];
    });
    
    return Bozuko.models[modelName].collection.mapReduce(
        
        mapFn,
        reduceFn,
        options,
        
        function(error, results){
            
            if( error ){
                console.log(error);
                return callback( error );
            }
            
            var items = [], map ={};
            results.forEach( function(result){
                var obj = result.value;
                obj._id = result._id;
                items.push(obj);
            });
            if( type !== 'time' ) return callback( null, items );
            
            items.sort(function(a,b){
                return +a[groupField] -b[groupField];
            });
            
            if( self.options.fillBlanks !== false ){
                var intervals = ['FullYear','Month','Date','Hours','Minutes','Seconds','Milliseconds'];
                var intervalMap = [DateUtil.YEAR, DateUtil.MONTH, DateUtil.DAY, DateUtil.HOUR, DateUtil.MINUTE, DateUtil.SECOND, DateUtil.MILLISECOND]
                var from = self.options.from || items[0][groupField],
                    to = self.options.to || new Date(); // DateUtil.add( new Date(), DateUtil.HOUR, 4);
                
                // set the clock back / forward so it returns the right day if we are looking at anything larger
                // than hours
                if(self.options.timezoneOffset && ~intervals.slice(0,3).indexOf( self.options.interval )  ){
                    from = new Date( from.getTime() + (self.options.timezoneOffset*1000*60*60) )
                    to = new Date( to.getTime() + (self.options.timezoneOffset*1000*60*60) )
                }
                
                var index = intervals.indexOf(self.options.interval || 'Date');
                if( !~index ) index = 0;
                var startArgs = [], endArgs = [];
                
                for(var i = 0; i < intervals.length && i <= index; i++ ){
                    startArgs.push(( i > index ) ? 0 : from['getUTC'+intervals[i]]());
                    endArgs.push(( i > index ) ? 0 : to['getUTC'+intervals[i]]());
                }
                
                var start = DateUtil.create(startArgs),
                    end = DateUtil.create(endArgs);
                
                var tmp = items.slice(),
                    j=0,
                    items = [],
                    item;
                    
                var withinSameInterval = function(ts, _id){
                    
                    b = DateUtil.create(_id.split(':'));
                    
                    var a = new Date(ts), aArgs=[], bArgs=[];
                    for(var i = 0; i < intervals.length; i++ ){
                        aArgs.push(( i > index ) ? 0 : a['getUTC'+intervals[i]]());
                        bArgs.push(( i > index ) ? 0 : b['getUTC'+intervals[i]]());
                    }
                    return Date.UTC.apply(null, aArgs) === Date.UTC.apply(null, bArgs);
                }
                
                for(var cur = +start; cur <= +end; cur += intervalMap[index] ){
                    
                    if( !tmp.length || !withinSameInterval(cur, tmp[0]._id ) ){
                        // add a blank
                        var blank = {_id: cur, count: 0};
                        blank[groupField] = new Date(cur);
                        items.push( blank );
                    }
                    else{
                        var entry = null;
                        while( tmp.length && withinSameInterval( cur, tmp[0]._id ) ){
                            var next = tmp.shift();
                            if( !entry ){
                                entry = next;
                                entry.timestamp = DateUtil.create( next._id.split(':') );
                            }
                            else entry.count += next.count;
                        }
                        items.push(entry);
                    }
                }
            }
            return callback( null, items);
        }
    );
};