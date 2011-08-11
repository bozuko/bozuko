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
}

EntryMethod.prototype.getEntryRequirement = function(){
    return "Valid Bozuko Account is required to enter.";
}

EntryMethod.prototype.getPlayLimitations = function(){
    return this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+DateUtil.duration(this.config.duration, true);
}

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
    self.validate( function(error, valid){

        if( error ){
            // yikes
            return callback(error);
        }
        if( !valid ) return callback( Bozuko.error('contest/invalid_entry') );
        
        var now = new Date();
        return self.contest.addEntry(self.getTokenCount(), function(error){
            if( error ) return callback(error);

            var entry = new Bozuko.models.Entry();
            self.loadEntry(entry, now);

            return entry.save( function(error){
                if (error) return callback(error);
                Bozuko.publish('contest/entry', {contest_id: self.contest._id, page_id: self.contest.page_id, user_id: self.user._id});
                return callback( error, entry );
            });
        });
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
 * Test to make sure there are enough tokens left in the contest to distribute
 *
 * @returns {Boolean} If there is enough tokens
 */
EntryMethod.prototype.ensureTokens = function(){
    return this.contest.token_cursor + this.getTokenCount() <= this.contest.total_plays - this.contest.total_free_plays;
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

        // check that there is enough tokens left
        if( self.ensureTokens() === false ){
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
        prof = Profiler.create('entry.load'),
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

EntryMethod.prototype.getNextEntryTime = function( callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        if( self._nextEntryTime ) return callback(null, self._nextEntryTime );
        var now = new Date();
        if( !self.user ){
            return callback(null, now);
        }
        return self.getLastEntry(function(err, lastEntry) {
            if (err) return callback(err);
            // assume we have the contest
            if( !lastEntry ) return callback( null, new Date() );
            // check the timestamp on this bad boy.
            var timestamp = +lastEntry.timestamp;
            timestamp += (self.config.duration||0);
            now = Date.now();
            self._nextEntryTime = new Date(timestamp > now ? timestamp : now);
            return callback(null, self._nextEntryTime);
        });
    });
};

EntryMethod.prototype.getLastEntry = function(callback){
    
    return Bozuko.models.Entry.find(
        {contest_id: this.contest._id, user_id: this.user._id},
        {},
        {sort: {timestamp: -1}, limit: 1},
        function(err, entries) {
            if (err) return callback(err);
            return callback(null, entries.length ? entries[0] : null);
        }
    );
};

EntryMethod.prototype.getButtonText = function( tokens, callback ){
    var self = this;
    if( self._buttonText ) return callback( null, self._buttonText );
    return this.load( function(error){
        if( error ) return callback( error );
        return self.getNextEntryTime( function( error, time ){

            if( error ) return callback( error );
            if( !tokens ){
                var now = new Date();
                if( time.getTime() >= now.getTime() ){
                    self._buttonText = _t( self.user ? self.user.lang : 'en', 'entry/bozuko/wait_duration', DateUtil.inAgo( time ) );
                }
                else{
                    self._buttonText =  _t( self.user ? self.user.lang : 'en', 'entry/enter');
                }
            }
            else{
                self._buttonText = _t( self.user ? self.user.lang : 'en', 'entry/play');
            }
            return callback( null, self._buttonText );
        });
    });
};

EntryMethod.prototype.getButtonEnabled = function( tokens, callback ){
    var self = this;
    self.getNextEntryTime( function(error, time){
        if( error ) return callback( error );
        var enabled = true;
        var now = new Date();
        if( time > now ){
            if( tokens == 0 ){
                enabled = false;
            }
        }
        return callback( null, enabled );
    });
};
