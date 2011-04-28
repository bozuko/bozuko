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

var proto = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.name = 'Abstract Entry Method';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.description = 'This type of entry needs';

/**
 * Button Text strings
 */
proto.button_text = {
    enter: "Enter",
    play: 'Play'
};

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
proto.image = '';

/**
 * To refresh or not, that is the question
 */
proto.refresh = false;

/**
 * Refresh rate
 *
 * How often to refresh (seconds)
 *
 * defauts 1 hour
 */
proto.refresh_interval = 1000*60*60*1;

/**
 * Configure the entryMethod
 *
 * @param {EntryConfig} config The configuration for this entry method
 */
proto.configure = function( config ){
    this.config = config;
};

/**
 * Set the Contest for the Entry Method
 *
 * @param {Contest} contest The contest for this entry.
 */
proto.setContest = function( contest ){
    this.contest = contest;
};

/**
 * Get the number of tokens to apply for this entry
 *
 * @returns {Number} The number of tokens for this contest
 */
proto.getTokenCount = function(){
    return this.config && this.config.tokens ? this.config.tokens : 1;
};

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
proto.process = function( callback ){
    
    if( !this.user ) return callback(Bozuko.error('entry/process_no_user'));
    var self = this;
    // first, update this contests token cursor
    // this actually needs another check to make sure that the contest
    // has not changed since we grabbed it.
    return Bozuko.models.Contest.update(
        {_id:this.contest._id, token_cursor:this.contest.token_cursor},
        {token_cursor: this.contest.token_cursor + this.getTokenCount()},
        function(error, object){
            if( error ){
                // this could be if the token_cursor changed...
                // so the best thing we can do is update the object...
                Bozuko.models.Contest.findById( self.contest.id, function(error, contest){
                    if( error ){
                        // we can't do anything here...
                        return callback( error );
                    }
                    if( contest.cursor_token == self.contest.cursor_token ){
                        // there was a weird problem..
                        // might want to try this again, but for now return an error
                        /**
                         * TODO - add multiple attempts
                         */
                        return callback( Bozuko.error('entry/token_update_fail') );
                    }
                    self.contest = contest;
                    if( !self.ensureTokens() ){
                        return callback( Bozuko.error('entry/not_enough_tokens') );
                    }
                    // try again...
                    return self.process( callback );
                });
            }
            else{
                // update our contest
                self.contest.token_cursor += self.getTokenCount();

                // create a Bozuko Entry model
                var entry = new Bozuko.models.Entry({
                    contest_id: self.contest.id,
                    user_id: self.user.id,
                    timestamp: new Date(),
                    type: self.type,
                    tokens: self.getTokenCount(),
                    intial_tokens: self.getTokenCount()
                });

                entry.save( function(error){
                    if( error ){
                        return callback( error );
                    }
                    return callback( null, entry );
                });

            }
        }
    );
};


/**
 * Test to make sure there are enough tokens left in the contest to distribute
 *
 * @returns {Boolean} If there is enough tokens
 */
proto.ensureTokens = function(){
    return this.contest.token_cursor + this.getTokenCount() < this.contest.total_plays;
};

/**
 * Check to see if the configuration for this entry type is satisfied
 *
 * The callback function receives an Error object or null on success
 *
 * @param {Callback} The Contest
 */
proto.validate = function( callback ){
    var self = this;
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
        var key = 'users.'+self.user.id+'entries.timestamp';
        var selector = {};
        selector[key] = {$gt: last};
        return Bozuko.models.Contest.nativeFind(selector, function(error, entries){
            if( error ) return callback( error );
            return callback( null, entries.length ? false: true);
        });
    }
    return callback( null );
};

proto.load = function(callback){
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

proto._load = function( callback ){
    callback();
}

proto.getNextEntryTime = function( callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        if( self._nextEntryTime ) callback(null, self._nextEntryTime );
        var now = new Date();
        if( !self.user ){
            return callback(null, now);
        }
        // assume we have the contest
        var u = self.contest.users ? self.contest.users[self.user.id] : false;
        if( !u || u.entries.length == 0) {
            return callback(null, now);
        }
        // lets peak at the top entry
        var e = u.entries[u.entries.length-1];
        // check the timestamp on this bad boy.
        var timestamp = e.timestamp;
        timestamp.setTime( timestamp.getTime() + (self.config.duration||0));
        var now = new Date();
        self._nextEntryTime = timestamp > now ? timestamp : now;
        return callback(null, self._nextEntryTime);
    });
};

proto.getButtonText = function( tokens, callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        if( !tokens ){
            return callback(null, self.button_text.enter );
        }
        return callback(null, self.button_text.play );
    });
};
