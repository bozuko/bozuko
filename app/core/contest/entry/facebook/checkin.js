var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
    dateFormat = require('dateformat');

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

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
FacebookCheckinMethod.prototype.name = 'Facebook Checkin';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
FacebookCheckinMethod.prototype.description = 'Checkin to a Facebook Page with Bozuko';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
FacebookCheckinMethod.prototype.icon = '';

/**
 * List Message String
 *
 */
FacebookCheckinMethod.prototype.list_message = 'Facebook check-in required';


/**
 * Configuration defaults
 *
 */
FacebookCheckinMethod.prototype.defaults = {
    duration: 1000*60*60*1,
    enable_like: false,
    like_tokens: 1
};


/**
 * Get Description - allow for formatting.
 *
 */
EntryMethod.prototype.getDescription = function(){

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
    var description = "Check In on Facebook\n";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;
    if( this.config.enable_like )
        description+= "\nDouble your plays if you like us on Facebook!";

    return description;
}


/**
 * Get the maximum amount of tokens
 *
 */
FacebookCheckinMethod.prototype.getMaxTokens = function(){
    return this.config.tokens + (this.config.enable_like ? this.config.like_tokens : 0);
}

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
FacebookCheckinMethod.prototype.getTokenCount = function(){
    if( !this.contest || !this.user) return this.config.tokens;
    var tokens = this.config.tokens;

    if( this.config.enable_like && this.user ){
        if( this.user.likes( this.page ) ){
            tokens += this.config.like_tokens;
        }
    }
    return tokens;
}

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
FacebookCheckinMethod.prototype.process = function( callback ){

    // lets process this...
    var self = this;

    if( !self.checkin ){
        return self.validate( function(error, valid){
            if( error ) return callback( error );
            if( !valid ) return callback( Bozuko.error('contest/invalid_entry') );

            if( self.can_checkin ){
                return self.page.checkin( self.user, {
                    user: self.user,
                    contest: self.contest,
                    service: 'facebook',
                    ll: self.options.ll,
                    message: self.options.message
                }, function(error, result){
                    if( error ){
                        return callback( error );
                    }

                    console.error("facebook checkin: process: result.entries.length = "+result.entries.length);
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
            // TODO: also look for other contests that are satisfied by this checkin?
            return EntryMethod.prototype.process.call(self, callback);

        });
    }


    return EntryMethod.prototype.process.call(this, callback);
};

FacebookCheckinMethod.prototype._load = function( callback ){
    var self = this;
    return Bozuko.models.Page.findById( self.contest.page_id, function(error, page){
        if( error ) return callback( error );
        if( !page ) return callback( Bozuko.error('contest/page_not_found'));
        self.page = page;
        if( !self.user ){
            self.can_checkin = true;
            return callback( null );
        }
        return page.canUserCheckin( self.user, function(error, flag, checkin, error2){
            if( error ) return callback( error );
            // if( error2 ) console.log(error2);
            self.can_checkin = flag;
            return callback(null);
        });
    });
};

FacebookCheckinMethod.prototype.getButtonText = function( tokens, callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        return self.getNextEntryTime( self.getLastEntry(), function( error, time ){

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
                    return callback(null, _t( self.user ? self.user.lang : 'en', use_time ? 'entry/facebook/wait_time' : 'entry/facebook/wait_date', time_str )  );
                }
                if( self.user && !self.can_checkin ){
                    return callback(null,  _t( self.user ? self.user.lang : 'en', 'entry/facebook/enter' )  );
                }
                return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/checkin_to_play' ));
            }
            return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/play' ) );
        });
    });

};
