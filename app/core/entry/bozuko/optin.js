var EntryMethod = Bozuko.require('core/entry'),
    _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date'),
    dateFormat = require('dateformat');

/**
 * Facebook Checkin
 *
 */
var BozukoOptinMethod = module.exports = function(options) {
    EntryMethod.call(this, options);
    this.options = options;
};

BozukoOptinMethod.prototype.__proto__ = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoOptinMethod.prototype.name = 'Opt-in Entry';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoOptinMethod.prototype.description = 'Subscribe to our newsletter to play';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
BozukoOptinMethod.prototype.icon = '';

/**
 * List Message String
 *
 */
BozukoOptinMethod.prototype.list_message = 'Newsletter subscription required';


/**
 * Configuration defaults
 *
 */
BozukoOptinMethod.prototype.defaults = {
    duration: 1000*60*60*1
};


/**
 * Get Description - allow for formatting.
 *
 */
BozukoOptinMethod.prototype.getDescription = function(callback){
    var self = this;
    // need a nice duration
    // get the number of minutes:
    var duration = DateUtil.duration( this.config.duration, true );
    var description = "Subscribe to our Newsletter\n";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "plays" : "play" )+" every "+duration;
    return callback(null, description);
};

/**
 * Get Description - allow for formatting.
 *
 */
BozukoOptinMethod.prototype.getHtmlDescription = function(callback){
    var self = this;
    // need a nice duration
    // get the number of minutes:
    var duration = DateUtil.duration( this.config.duration, true );
    var description = "Subscribe to our email newsletter and receive ";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "plays" : "play" )+" every "+duration+'.';
    return description;
};


/**
 * Get the maximum amount of tokens
 *
 */
BozukoOptinMethod.prototype.getMaxTokens = function(){
    return this.config.tokens;
};

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
BozukoOptinMethod.prototype.getTokenCount = function(){
    return this.config.tokens;
};


BozukoOptinMethod.prototype._load = function( callback ){
    var self = this;
	// we just need to know if this dude has opted in yet
	if( !self.user ){
		self._subscribed = false;
		return callback();
	}
	Bozuko.models.Optin.findOne({user_id: self.user._id, page_id: self.page._id}, function(error, optin){
		if( error ) return callback( error );
		self._subscribed = !!optin;
		return callback();
	});
};

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
BozukoOptinMethod.prototype.process = function( callback ){
    var self = this;
	return self.load(function(error){
		if( error ) return callback( error );
		if( self._subscribed ) return callback();
		// create an optin record
		return Bozuko.models.Optin.create(self.user, self.page, self.contest, callback);
	});
};

BozukoOptinMethod.prototype.getButtonText = function( nextEntryTime, tokens ){
    var text = '';
    if( !tokens ){
        var now = new Date();
		if( +this.contest.end < Date.now() ){
			text = _t( this.user ? this.user.lang : 'en', 'entry/game_over' );
		}
		else if( +this.contest.start < Date.now() ){
			text = _t( this.user ? this.user.lang : 'en', 'entry/game_starts', DateUtil.inAgo(this.contest.start) );
		}
        else if (nextEntryTime.getTime() >= this.contest.end.getTime()) {
			text = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/thanks_for_playing' );
        } else if( +nextEntryTime > +now ){
            text = _t( this.user ? this.user.lang : 'en', 'entry/facebook/wait_duration', DateUtil.inAgo(nextEntryTime) );
        } else if( this.user ){
            if( !this._subscribed ){
                text = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/optin_enter' );
            }  else {
                text = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/play');
            }
        } else {
            text =  _t( this.user ? this.user.lang : 'en', 'entry/bozuko/optin_enter' );
        }
    } else {
        text = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/play' );
    }
    return text;
};