var EntryMethod = Bozuko.require('core/entry'),
    _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date'),
    dateFormat = require('dateformat');

/**
 * Facebook Checkin
 *
 */
var BozukoNothingMethod = module.exports = function(options) {
    EntryMethod.call(this, options);
    this.options = options;
};

BozukoNothingMethod.prototype.__proto__ = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoNothingMethod.prototype.name = 'Bozuko Entry';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoNothingMethod.prototype.description = 'Play from anywhere!';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
BozukoNothingMethod.prototype.icon = '';

/**
 * List Message String
 *
 */
BozukoNothingMethod.prototype.list_message = 'Facebook login required';


/**
 * Configuration defaults
 *
 */
BozukoNothingMethod.prototype.defaults = {
    duration: 1000*60*60*1
};


/**
 * Get Description - allow for formatting.
 *
 */
BozukoNothingMethod.prototype.getDescription = function(callback){
    var self = this;
    // need a nice duration
    // get the number of minutes:
    var duration = DateUtil.duration( this.config.duration, true );
    var description = "Play Bozuko\n";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "plays" : "play" )+" every "+duration;
    return callback(null, description);
};

/**
 * Get Description - allow for formatting.
 *
 */
BozukoNothingMethod.prototype.getHtmlDescription = function(callback){
    var self = this;
    // need a nice duration
    // get the number of minutes:
    var duration = DateUtil.duration( this.config.duration, true );
    var description = "Just login and you will receive ";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "plays" : "play" )+" every "+duration+'.';
    return description;
};


/**
 * Get the maximum amount of tokens
 *
 */
BozukoNothingMethod.prototype.getMaxTokens = function(){
    return this.config.tokens;
};

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
BozukoNothingMethod.prototype.getTokenCount = function(){
    return this.config.tokens;
};

BozukoNothingMethod.prototype.getButtonText = function( nextEntryTime, tokens ){
    if( !tokens ){
		if( !this.contest.active ){
			return _t( this.user ? this.user.lang : "en", 'entry/game_before');
		}
        var now = new Date();
		if( +this.contest.end < Date.now() ){
			return _t( this.user ? this.user.lang : 'en', 'entry/game_over' );
		}
		if( +this.contest.start > Date.now() ){
			return _t( this.user ? this.user.lang : 'en', 'entry/game_starts', DateUtil.inAgo(this.contest.start) );
		}
        if (nextEntryTime.getTime() >= this.contest.end.getTime()) {
			return _t( this.user ? this.user.lang : 'en', 'entry/bozuko/thanks_for_playing' );
        }
        if( nextEntryTime.getTime() > now.getTime() ){
            var time_str = DateUtil.inAgo( nextEntryTime );
            return _t( this.user ? this.user.lang : 'en', 'entry/bozuko/wait_duration', time_str );
        }
        return _t( this.user ? this.user.lang : 'en', 'entry/bozuko/play' );
    }
    return _t( this.user ? this.user.lang : 'en', 'entry/bozuko/play' );
};
