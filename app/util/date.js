var DateUtil = module.exports = {};

DateUtil.MILLISECOND = 1;
DateUtil.SECOND = DateUtil.MILLISECOND * 1000;
DateUtil.MINUTE = DateUtil.SECOND * 60;
DateUtil.HOUR = DateUtil.MINUTE * 60;
DateUtil.DAY = DateUtil.HOUR * 24;
DateUtil.WEEK = DateUtil.DAY * 7;
DateUtil.MONTH = DateUtil.DAY * 28;
DateUtil.YEAR = DateUtil.DAY * 365;

DateUtil.add = function( date, interval, amount ){
    return new Date( +date + (interval * amount) );
};

DateUtil.create = function(args){
    var now = new Date();
    if( !Array.isArray(args) ) args = [].slice.apply(arguments);
    while( args.length < 7 ) args.push( args.length == 3 ? 12 : 0);
    return new Date( Date.UTC(args[0], args[1], args[2] || 1, args[3], args[4], args[5], args[6]) );
}

function pluralize(num, str, hide1, pstr){
    if( !pstr ) pstr = str+'s';
    var ret = hide1 && num===1 ? '' : (num+' ');
    return ret+ (num === 1 ? str : pstr);
}

DateUtil.inAgo = function(then, now){
    if( !now ) now = new Date();
    
    var future = +then > +now,
        str = DateUtil.relative(then, now)
        ;
        
    return future ? 'in '+str : str+' ago';
}

DateUtil.relative = function(then, now){
    if( !now ) now = new Date();
    
    var ms = Math.abs(+now -then);
    return DateUtil.duration(ms);
};

DateUtil.duration = function(ms, hide1){
    
    if( ms >= (DateUtil.WEEK - (DateUtil.DAY/2)) ){
        return pluralize(Math.round( ms / DateUtil.WEEK ), 'week', hide1);
    }
    
    if( ms >= (DateUtil.DAY - (DateUtil.HOUR*2)) ){
        return pluralize(Math.round( ms / DateUtil.DAY ), 'day', hide1);
    }
    
    if( ms >= (DateUtil.HOUR) ){
        return pluralize(Math.round( ms / DateUtil.HOUR ), 'hour', hide1);
    }
    
    if( ms >= (DateUtil.MINUTE - (DateUtil.SECOND*30)) ){
        return pluralize(Math.round( ms / DateUtil.MINUTE ), 'minute', hide1);
    }
    
    return pluralize(Math.round( ms / DateUtil.SECOND ) || 1, 'second', hide1);
};