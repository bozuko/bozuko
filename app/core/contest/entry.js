var bozuko = require('bozuko');

/**
 * Abstract class for method of entry
 *
 * Defines what all Entry Methods must have for variables / methods
 * 
 * @param {String} key The key for this entry
 */
var Entry = module.exports = function(type, user){
    this.type = type;
    this.user = user;
};

var proto = Entry.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.name = 'Abstract Entry Method';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.description = 'This type of entry needs';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
proto.icon = '';

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
    var self = this;
    // first, update this contests token cursor
    // this actually needs another check to make sure that the contest
    // has not changed since we grabbed it.
    bozuko.models.Contest.update(
        {_id:this.contest._id, token_cursor:this.contest.token_cursor},
        {token_cursor: this.contest.token_cursor + this.getTokenCount()},
        function(error, object){
            if( error ){
                // this could be if the token_cursor changed...
                // so the best thing we can do is update the object...
                bozuko.models.Contest.findById( self.contest.id, function(error, contest){
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
                        return callback( bozuko.error('entry/token_update_fail') );
                    }
                    self.contest = contest;
                    if( !self.ensureTokens() ){
                        return callback( bozuko.error('entry/not_enough_tokens') );
                    }
                    // try again...
                    return self.process( callback );
                });
            }
            else{
                // update our contest
                self.contest.token_cursor += self.getTokenCount();
                
                // create a Bozuko Entry model
                var Entry = new bozuko.models.Entry({
                    contest_id: self.contest.id,
                    user_id: self.user.id,
                    timestamp: new Date(),
                    type: self.type,
                    tokens: self.getTokenCount()
                });
                
                Entry.save( function(error){
                    if( error ){
                        return callback( error );
                    }
                    return callback( null, Entry );
                });
                
            }
        }
    )
};


/**
 * Test to make sure there are enough tokens left in the contest to distribute
 *
 * @returns {Boolean} If there is enough tokens
 */
proto.ensureTokens = function(){
    return this.contest.token_cursor + this.getTokenCount() < this.contest.total_entries;
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
    if( !this.contest ) return callback( bozuko.error('entry/no_contest') );
    
    // check for user
    if( !this.user ) return callback( bozuko.error('entry/no_user') );
    
    // check that there is enough tokens left
    if( this.ensureTokens() === false ){
        return callback( bozuko.error('entry/not_enough_tokens') );
    }
    
    // check for duration
    if( this.config && this.config.duration ){
        var now = new Date();
        var last = new Date();
        last.setTime( now.getTime() - duration );
        
        return bozuko.models.Entry.find({
            user_id:self.user.id,
            contest_id: self.contest.id,
            timestamp:{'gt':last}
        }, function(error, entry){
            if( entry ){
                // ruh, ro.
                var now = new Date();
                var next = new Date();
                next.setTime(entry.timestamp.getTime()+self.config.duration);
                callback( bozuko.error('entry/too_soon', next) );
            }
            else{
                callback( null );
            }
        });
    }
    
    return callback( null );
};