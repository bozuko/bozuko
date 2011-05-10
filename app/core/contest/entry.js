var _t = Bozuko.t,
    dateFormat = require('dateformat');
    
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
EntryMethod.prototype.getDescription = function(){
    return this.description;
}


/**
 * Configure the entryMethod
 *
 * @param {EntryConfig} config The configuration for this entry method
 */
EntryMethod.prototype.configure = function( config ){
    var i, self = this;
    this.config = {};
    var _defaults = function(o){
        var p = Object.getPrototypeOf(o);
        if( p && p.defaults ) _defaults(p);
        for( i in o.defaults ){
            self.config[i] = o.defaults[i];
        }
    };
    _defaults(this);
    if( config.toObject ){
        config = config.toObject();
    }
    for( i in config ){
        this.config[i] = config[i];
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
    self.validate( function(error){

        if( error ){
            // yikes
            return callback(error);
        }

        var e = {
            contest_id: self.contest.id,
            timestamp: new Date(),
            type: self.type,
            tokens: self.getTokenCount(),
            initial_tokens: self.getTokenCount()
        };

        var tries = self.total_plays - self.token_cursor;
        return self.contest.addUserEntry(self.user.id, e, tries, function(error, entry){
            if( error ) return callback(error);
            
            // save a top level entry for analytics
            var Entry = new Bozuko.models.Entry();
            self.prepareAnalyticEntry( Entry );
            Entry.timestamp = entry.timestamp;
            
            return Entry.save( function(error){
                return callback( error, entry );
            });
        });
    });
};

EntryMethod.prototype.prepareAnalyticEntry = function( Entry ){
    var self = this;
    Entry.contest_id = self.contest._id;
    Entry.page_id = self.contest.page_id;
    Entry.user_id = self.user._id;
    Entry.type = self.type;
};


/**
 * Test to make sure there are enough tokens left in the contest to distribute
 *
 * @returns {Boolean} If there is enough tokens
 */
EntryMethod.prototype.ensureTokens = function(){
    return this.contest.token_cursor + this.getTokenCount() < this.contest.total_plays;
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
            var key = 'users.'+self.user.id+'.entries.timestamp';
            var selector = {};
            selector[key] = {$gt: last};
            return Bozuko.models.Contest.nativeFind(selector, function(error, entries){
                if( error ) return callback( error );
                return callback( null, entries.length ? false: true);
            });
        }
        return callback( null );
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
        return self._load(function(error){
            self._loaded = true;
            callback(error);
        });
    }
    return callback();
};

EntryMethod.prototype._load = function( callback ){
    callback();
}

EntryMethod.prototype.getNextEntryTime = function( callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        if( self._nextEntryTime ) return callback(null, self._nextEntryTime );
        var now = new Date();
        if( !self.user ){
            return callback(null, now);
        }
        // assume we have the contest
        var e = self.getLastEntry();
        if( !e ) return callback( null, new Date() );
        // check the timestamp on this bad boy.
        var timestamp = e.timestamp;
        timestamp.setTime( timestamp.getTime() + (self.config.duration||0));
        var now = new Date();
        self._nextEntryTime = timestamp > now ? timestamp : now;
        return callback(null, self._nextEntryTime);
    });
};

EntryMethod.prototype.getLastEntry = function(){
    // assume we have the contest
    var self = this;
    var u = self.contest.users ? self.contest.users[self.user.id] : false;
    if( !u || u.entries.length == 0) {
        return false;
    }
    // lets peak at the top entry
    return u.entries[u.entries.length-1];
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
                    self._buttonText = _t( self.user ? self.user.lang : 'en', 'entry/wait', relativeDate( time) );
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