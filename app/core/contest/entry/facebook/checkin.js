var EntryMethod = Bozuko.require('core/contest/entry');

/**
 * Facebook Checkin
 *
 */
var FacebookCheckinMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
    this.checkin = this.options.checkin || false;
    this._lastCheckin = false;
};

FacebookCheckinMethod.prototype.__proto__ = EntryMethod.prototype;

var proto = FacebookCheckinMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.name = 'Facebook Checkin';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
proto.description = 'Checkin to a Facebook Page with Bozuko';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
proto.icon = '';


/**
 * Configuration defaults
 *
 */
proto.defaults = {
    refill : false,
    refill_duration: 1000*60*60,
    refill_max: 4,
    duration: 1000*60*60*4,
    enable_like: false,
    like_tokens: 1
};

/**
 * Get the maximum amount of tokens
 *
 */
proto.getMaxTokens = function(){
    return this.config.tokens + (this.config.enable_like ? this.config.like_tokens : 0);
}

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
proto.getTokenCount = function(){
    if( !this.contest || !this.user) return this.config.tokens;
    var tokens = this.config.tokens;
    
    if( this.config.enable_like && this.user && this.user.likes( this.contest.page ) ){
        tokens += this.config.like_tokens;
    }
    return tokens;
}

/**
 * Check to see if the configuration for this entry type is satisfied
 *
 * @param {Function} Callback Function
 */
proto.validate = function( callback ){
    
    // we need to check to see if this entry method has been satisified.
    var self = this;
    
    
    // first lets check for any previous entries in this contest
    EntryMethod.prototype.validate.call( this, function(error, valid){
        if( error ){
            console.log("error from validate call");
            return callback( error );
        }
        if( self.checkin && self.checkin.page_id+'' != self.contest.page_id+'' ){
            return callback( Bozuko.error('entry/facebook/invalid_checkin') );
        }
        // no previous checkin, all good
        if( !self._lastCheckin ){
            return callback( null, true );
        }
        
        var ts = new Date();
        ts.setTime( ts.getTime() - self.config.duration );
        
        // if the last checkin was over the duration period, no good
        if( ts.getTime() < self._lastCheckin.timestamp.getTime() ){
            return callback( null, false );
        }
        
        return callback( null, true );
        
    });
};

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
proto.process = function( callback ){

    // lets process this...
    var self = this;
    EntryMethod.prototype.process.call(this, callback);
};

proto._load = function(callback){
    var self = this;
    // need to get the users last checkin
    if( !this.user ) return callback();
    
    // selectors 
    var selector = {user_id: this.user.id};
    if( self.checkin ){
        selector._id = {$ne: self.checkin._id};
    }
    
    return Bozuko.models.Checkin.find(
        {user_id: this.user.id},
        {},
        {limit:1, sort: {timestamp: -1}},
        function(error, checkins){
            if( checkins && checkins.length ){
                this._lastCheckin = checkins[0];
            }
            
            Bozuko.models.Page.findById( self.contest.page_id, function(error, page){
                if( error ) return callback( error );
                self.contest.page = page;
                return callback( null );
            });
        }
    );
}

proto.getNextEntryTime = function( callback ){
    var self = this;
    EntryMethod.prototype.getNextEntryTime.call( this, function(error, time){
        
        if( error ) return callback( error );
        if( !self.config.refill ) return callback( null, time );
        
        // okay, well, if we can refill, the time might be sooner
        var u = self.contest.users ? self.contest.users[self.user.id] : false;
        if( !u || u.entries.length == 0) {
            return callback(null, now);
        }
        
        // lets peak at the top entry
        var e = u.entries[u.entries.length-1];
        
        var timestamp = e.timestamp;
        var end = new Date();
        end.setTime(timestamp.getTime() + self.config.duration );
        
        if( e.refills && e.refills.length < self.config.refill_max ){
            var lastRefill = e.refills[e.refills.length-1];
            timestamp.setTime( lastRefill.getTime() );
        }
        
        timestamp.setTime( timestamp.getTime() + self.config.refill_duration );
        return callback( null, end.getTime() < timestamp.getTime() ? end : timestamp );
        
    });
};