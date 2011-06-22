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
    if( !Array.isArray(args) ) args = [].slice.apply(arguments);
    while( args.length < 7 ) args.push(0);
    return new Date( args[0], args[1], args[2] || 1, args[3], args[4], args[5], args[6] );
}