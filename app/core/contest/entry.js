var _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date'),
    merge = Bozuko.require('util/merge'),
    dateFormat = require('dateformat'),
    Profiler = Bozuko.require('util/profiler')
;

/**
 * Abstract class for method of entry
 *
 * Defines what all Entry Methods must have for variables / methods
 *
 * @param {String} key The key for this entry
 */
var EntryMethod = module.exports = function(type, /* optional */ user){
    this.type = type;
    this.user = user;
};

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
EntryMethod.prototype.name = 'Abstract Entry Method';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
EntryMethod.prototype.description = 'This type of entry needs';

EntryMethod.prototype.defaults = {
    duration: 1000*60*1
};

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
EntryMethod.prototype.image = '';


/**
 * List Message String
 *
 */
EntryMethod.prototype.list_message = 'Nothing is required to play this game.';


/**
 * Get List Message
 *
 */
EntryMethod.prototype.getListMessage = function(){
    return this.list_message;
}


/**
 * Get Description - allow for formatting.
 *
 */
EntryMethod.prototype.getDescription = function(callback){
    return callback(null, this.description);
}


/**
 * Get HTML Description
 *
 */
EntryMethod.prototype.getHtmlDescription = function(callback){
    return this.description;
};

EntryMethod.prototype.getEntryRequirement = function(){
    return "Valid Bozuko Account is required to enter.";
};

EntryMethod.prototype.getPlayLimitations = function(){
    return this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+DateUtil.duration(this.config.duration, true);
};

/**
 * Configure the entryMethod
 *
 * @param {EntryConfig} config The configuration for this entry method
 */
EntryMethod.prototype.configure = function( config ){
    var i, self = this;
    this.config = {};
    for( var p in this.defaults ){
        this.config[p] = this.defaults[p];
    }
    if( config.toObject ){
        config = config.toObject();
    }
    for( p in config ){
        this.config[p] = config[p];
    }
};

/**
 * Set the Contest for the Entry Method
 *
 * @param {Contest} contest The contest for this entry.
 */
EntryMethod.prototype.setContest = function( contest ){
    this.contest = contest;
};

/**
 * Get the number of tokens to apply for this entry
 *
 * @returns {Number} The number of tokens for this contest
 */
EntryMethod.prototype.getTokenCount = function(){
    return this.config && this.config.tokens ? this.config.tokens : 1;
};

EntryMethod.prototype.getMaxTokens = function(){
    return this.getTokenCount();
}

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
EntryMethod.prototype.process = function( callback ){

    if( !this.user ) return callback(Bozuko.error('entry/process_no_user'));
    if( !this.contest ) return callback(Bozuko.error('entry/process_no_contest'));

    var self = this;
    self.validate(function(error, valid){
        if( error ) return callback(error);
        if( !valid ) return callback( Bozuko.error('contest/invalid_entry') );
        var now = new Date();
        var entry = new Bozuko.models.Entry();
        self.loadEntry(entry, now);
        return callback( error, entry );
    });
};

EntryMethod.prototype.loadEntry = function( entry, timestamp ){
    var self = this;
    entry.contest_id = self.contest._id;
    entry.page_id = self.contest.page_id;
    entry.user_id = self.user._id;
    entry.user_name = self.user.name;
    entry.page_name = self.page.name;
    entry.type = self.type;
    entry.tokens = self.getTokenCount();
    entry.initial_tokens = self.getTokenCount();
    entry.timestamp = timestamp;
};

/**
 * Check to see if the configuration for this entry type is satisfied
 *
 * The callback function receives an Error object or null on success
 *
 * @param {Callback} The Contest
 */
EntryMethod.prototype.validate = function( callback ){
    var self = this;
    self.load( function( error ){
        if( error ) return callback( error );
        // check for contest
        if( !self.contest ) return callback( Bozuko.error('entry/no_contest') );

        // check for user
        if( !self.user ) return callback( Bozuko.error('entry/no_user') );

        // check that there are enough tokens left
        if( self.contest.ensureTokens(self) === false ){
            return callback( Bozuko.error('entry/not_enough_tokens') );
        }

        // check for duration
        if( self.config && self.config.duration ){
            var now = new Date();
            var last = new Date();
            last.setTime( now.getTime() - self.config.duration );
            // need to check for other entries

            var selector = {
                contest_id: self.contest._id,
                user_id: self.user._id,
                timestamp: {$gt : last}
            };

            return Bozuko.models.Entry.find(selector, function(error, entries){
                if( error ) return callback( error );
                return callback( null, entries.length ? false: true);
            });
        }
        return callback( null, true );
    });
};

EntryMethod.prototype.load = function(callback){
    var self = this,
        force = false;

    if( arguments.length > 1 ){
        callback = arguments[1];
        force = arguments[0];
    }
    // this contest should already have previous entries
    if( force || !self._loaded ){
        // always get the page
        return Bozuko.models.Page.findById( self.contest.page_id, function(error, page){
            if( error ) return callback( error );
            if( !page ) return callback( Bozuko.error('contest/page_not_found'));
            self.page = page;
            return self._load(function(error){
                self._loaded = true;
                return callback(error);
            });
        });
    }
    return callback();
};

EntryMethod.prototype._load = function( callback ){
    callback();
};

EntryMethod.prototype.getNextEntryTime = function( lastEntry ){
    var self = this;
    var now = new Date();
    if( !self.user ) return now;
    if( !lastEntry ) return now;
    var timestamp = +lastEntry.timestamp;
    timestamp += (self.config.duration||0);
    now = Date.now();
    self._nextEntryTime = new Date(timestamp > now ? timestamp : now);
    return self._nextEntryTime;
};

EntryMethod.prototype.getButtonText = function(nextEntryTime, tokens){
    if( !tokens ){
        var now = new Date();
        if( nextEntryTime.getTime() >= now.getTime() ){
            this._buttonText = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/wait_duration', DateUtil.inAgo( nextEntryTime ) );
        } else{
            this._buttonText =  _t( this.user ? this.user.lang : 'en', 'entry/enter');
        }
    } else{
        this._buttonText = _t( this.user ? this.user.lang : 'en', 'entry/play');
    }
    return this._buttonText;
};

EntryMethod.prototype.getButtonEnabled = function( nextEntryTime, tokens ){
    var enabled = true;
    var now = new Date();
    if( nextEntryTime > now && tokens === 0) enabled = false;
    return enabled;
};

EntryMethod.prototype.getButtonState = function(lastEntry, tokens, callback) {
    var self = this;
    var state = {};
    return this.load(function(error) {
        if (error) return callback(error);
        var time = self.getNextEntryTime(lastEntry);
        state.next_enter_time = time;
        state.text = self.getButtonText(time, tokens);
        state.enabled = self.getButtonEnabled(time, tokens);
        return callback(null, state);
    });
};
