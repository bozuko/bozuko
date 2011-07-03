var Report = Bozuko.require('core/report'),
    inherits = require('util').inherits,
    DateUtil = Bozuko.require('util/date')
    ;
    
var CountsReport = module.exports = function(options){
    Report.apply(this, arguments);
};
inherits( CountsReport, Report );

CountsReport.mapFunctionTmpl = {
    
    time: (function(){
        var ts = this.FIELDNAME;
        var timestamp = Date.UTC(ts.getFullYear(), 0, 0, 12, 0, 0, 0);
        emit( timestamp, {timestamp: new Date(timestamp), count: 1} );
    }).toString(),
    
    filter: (function(){
        var value = this.FIELDNAME
        emit( value, {FIELDNAME: value, count: 1});
    }).toString()
};

CountsReport.getMapFunction = function getMapFunction(type, field, interval){
    
    var fn = this.mapFunctionTmpl[type].replace(/FIELDNAME/, field);
    if( type == 'filter') return fn;
    
    var intervals = ['Month','Date','Hours','Minutes','Seconds','Milliseconds'];
    
    // replace zeros
    var index = intervals.indexOf(interval);
    if( ~index ){
        for(var i = 0; i < index+1; i++ ){
            str = 'ts.get'+intervals[i]+'()';
            fn = fn.replace(/(0|12)/, str);
        }
    }
    return fn;
};

CountsReport.getReduceFunction = function getReduceFunction(field){
    return (function(key, values){
        var count = 0;
        values.forEach( function(value){
            count += value.count;
        });
        var ret = {};
        ret.FIELDNAME = values[0].FIELDNAME;
        ret.count = count;
        return ret;
    }).toString().replace( /FIELDNAME/g, field);
};

CountsReport.prototype.run = function run(callback){
    
    var self = this,
        modelName = this.options.model || 'Entry';
    
    if( !Bozuko.models[modelName] ) throw Bozuko.error('report/counts/no_model');
    
    var type = this.options.type || 'time',
        field = this.options.field || (type=='time' ? 'timestamp' : false);
    
    if( !field ) throw Bozuko.error('report/counts/no_field');
    
    var mapFn = this.options.mapFn ||
        (type == 'time' ?
            CountsReport.getMapFunction('time', this.options.field || 'timestamp', this.options.interval || 'Date') :
            CountsReport.getMapFunction('filter', this.options.field )
        );
    
    var reduceFn = this.options.reduceFn || CountsReport.getReduceFunction( field );
    
    var options = {};
    if( this.options.query ){
        options.query = this.options.query;
    }
    if( type=='time' ){
        if( !options.query ) options.query = {};
        if( !options.query[field] ) options.query[field] = {};
        if( this.options.from ){
            options.query[field].$gt = this.options.from;
        }
        options.query[field].$lt = this.options.to || new Date();
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
            var items = [];
            results.forEach( function(result){
                var obj = result.value;
                obj._id = result._id;
                items.push(obj);
            });
            if( type !== 'time' || !items.length ) return callback( null, items );
            
            items.sort(function(a,b){
                return a._id - b._id;
            });
            
            if( self.options.fillBlanks !== false ){
                var intervals = ['FullYear','Month','Date','Hours','Minutes','Seconds','Milliseconds'];
                var from = self.options.from || items[0][field],
                    to = self.options.to || DateUtil.add( new Date(), DateUtil.DAY, 1);
                
                var index = intervals.indexOf(self.options.interval || 'Date');
                if( !~index ) index = 0;
                var startArgs = [], endArgs = [];
                
                for(var i = 0; i < index+1; i++ ){
                    startArgs.push(from['get'+intervals[i]]());
                    endArgs.push(to['get'+intervals[i]]());
                }
                var start = DateUtil.create(startArgs),
                    end = DateUtil.create(endArgs);
                
                var tmp = items.slice(), i=0;
                items = [];
                
                for(var cur = +start; cur <= +end; cur +=  DateUtil.DAY ){
                    if( !tmp.length || cur < tmp[i]._id ){
                        // add a blank
                        var blank = {_id: cur, count: 0};
                        blank[field] = new Date(cur);
                        items.push( blank );
                    }
                    else{
                        items.push( tmp[i++] );
                    }
                }
                
            }
            return callback( null, items);
        }
    );
};