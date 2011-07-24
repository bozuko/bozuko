var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date'),
    dateFormat = require('dateformat');

/**
 * Facebook Checkin
 *
 */
var BozukoCheckinMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
    this.checkin = this.options.checkin || false;
    this._lastCheckin = false;
};

BozukoCheckinMethod.prototype.__proto__ = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoCheckinMethod.prototype.name = 'Bozuko Checkin';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoCheckinMethod.prototype.description = 'Checkin to a Facebook Page with Bozuko';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
BozukoCheckinMethod.prototype.icon = '';

/**
 * List Message String
 *
 */
BozukoCheckinMethod.prototype.list_message = 'Bozuko check-in required';


/**
 * Configuration defaults
 *
 */
BozukoCheckinMethod.prototype.defaults = {
    duration: 1000*60*60*1
};


/**
 * Get Description - allow for formatting.
 *
 */
BozukoCheckinMethod.prototype.getDescription = function(callback){
    var self = this;
    
    return self.load(function(error){
        // need a nice duration
        var duration = DateUtil.duration(self.config.duration, true);
        var description = "Check In on Bozuko\n";
            description+= self.config.tokens+" "+(self.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;
    
        return callback(error, description);
    });
}

/**
 * Get Html Description - allow for formatting.
 *
 */
BozukoCheckinMethod.prototype.getHtmlDescription = function(){
    var self = this;
    // need a nice duration
    var duration = DateUtil.duration(self.config.duration, true);
    var description = "Check In on Bozuko and get \n";
        description+= self.config.tokens+" "+(self.config.tokens > 1 ? "plays" : "play" )+" every "+duration+'.';

    return description;
}


BozukoCheckinMethod.prototype.getEntryRequirement = function(){
    return 'Must be at this location to enter.';
}



/**
 * Get the maximum amount of tokens
 *
 */
BozukoCheckinMethod.prototype.getMaxTokens = function(){
    return this.config.tokens;
}

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
BozukoCheckinMethod.prototype.getTokenCount = function(){
    return this.config.tokens;
}

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
BozukoCheckinMethod.prototype.process = function( callback ){

    // lets process this...
    var self = this;

    if( !self.checkin ){
        return self.validate( function(error, valid){
            if( error ) return callback( error );
            if( !valid ) return callback( Bozuko.error('contest/invalid_entry') );

            if( self.can_checkin ){
                return self.page.checkin( self.user, {
                    test: true,
                    user: self.user,
                    contest: self.contest,
                    service: 'bozuko',
                    ll: self.options.ll,
                    message: self.options.message
                }, function(error, result){
                    if( error ) return callback( error );

                    for(var i=0; i<result.entries.length; i++){
                        var entry = result.entries[i];
                        if( entry.type == self.type && entry.contest_id == self.contest.id ){
                            // this is our entry
                            return callback( null, entry );
                        }
                    }

                    return callback( Bozuko.error('contest/no_entry_found_after_checkin') );
                });
            }

            return EntryMethod.prototype.process.call(self, callback);

        });
    }


    return EntryMethod.prototype.process.call(this, callback);
};

BozukoCheckinMethod.prototype._load = function( callback ){
    var self = this;
    if( !self.user ){
        self.can_checkin = true;
        return callback( null );
    }
    return self.page.canUserCheckin( self.user, function(error, flag){
        if( error ) return callback( error );
        self.can_checkin = flag;
        return callback(null);
    });
};

BozukoCheckinMethod.prototype.getButtonText = function( tokens, callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        return self.getNextEntryTime( function( error, time ){

            if( error ) return callback( error );
            if( !tokens ){
                var now = new Date();
                if( time.getTime() > now.getTime() ){
                    var time_str = DateUtil.inAgo( time );
                    return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/bozuko/wait_duration', time_str )  );
                }
                if( self.user && !self.can_checkin ){
                    return callback(null,  _t( self.user ? self.user.lang : 'en', 'entry/bozuko/enter' )  );
                }
                return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/bozuko/checkin_to_play' ));
            }
            return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/bozuko/play' ) );
        });
    });

};
