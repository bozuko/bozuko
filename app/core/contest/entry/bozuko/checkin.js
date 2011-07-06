var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
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
BozukoCheckinMethod.prototype.getDescription = function(){

    // need a nice duration
    // get the number of minutes:
    var seconds = this.config.duration / 1000,
        minutes = seconds / 60,
        hours = minutes / 60,
        days = hours / 24;

    var duration = '';
    if( days > 1 ){
        days = Math.floor( days );
        duration = days==1 ? 'day': (days+' days');
    }
    else if( hours > 2 ){
        duration = hours+' hours';
    }
    else if( minutes > 1 ){
        duration = Math.ceil(minutes)+' minutes';
    }
    else{
        duration = Math.ceil(seconds)+' seconds';
    }
    var description = "Check In on Bozuko\n";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;

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
    return Bozuko.models.Page.findById( self.contest.page_id, function(error, page){
        if( error ) return callback( error );
        if( !page ) return callback( Bozuko.error('contest/page_not_found'));
        self.page = page;
        if( !self.user ){
            self.can_checkin = true;
            return callback( null );
        }
        return page.canUserCheckin( self.user, function(error, flag){
            if( error ) return callback( error );
            self.can_checkin = flag;
            return callback(null);
        });
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
                    var ms = time.getTime() - now.getTime();
                    // get the number of minutes:
                    var seconds = ms / 1000;
                    var minutes = seconds / 60;
                    var hours = minutes / 60;
                    var days = hours / 24;
                    var use_time = true;
                    var time_str = dateFormat( time, 'hh:MM:ss TT');
                    if( days > 1 ){
                        use_time = false;
                        time_str = Math.floor(days);
                        time_str = ( time_str > 1 ) ? (time_str+' Days') : (time_str+' Day');
                    }
                    if( minutes > 1 ){
                        time_str = dateFormat( time, 'hh:MM TT');
                    }
                    return callback(null, _t( self.user ? self.user.lang : 'en', use_time ? 'entry/bozuko/wait_time' : 'entry/bozuko/wait_date', time_str )  );
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
