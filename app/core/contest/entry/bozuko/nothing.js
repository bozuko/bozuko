var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
    dateFormat = require('dateformat');

/**
 * Facebook Checkin
 *
 */
var BozukoNothingMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
};

BozukoNothingMethod.prototype.__proto__ = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoNothingMethod.prototype.name = 'Bozuko Entry';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
BozukoNothingMethod.prototype.description = 'Play from anywhere!';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
BozukoNothingMethod.prototype.icon = '';

/**
 * List Message String
 *
 */
BozukoNothingMethod.prototype.list_message = 'Facebook login required';


/**
 * Configuration defaults
 *
 */
BozukoNothingMethod.prototype.defaults = {
    duration: 1000*60*60*1
};


/**
 * Get Description - allow for formatting.
 *
 */
BozukoNothingMethod.prototype.getDescription = function(){

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
    var description = "Play Bozuko\n";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;

    return description;
}


/**
 * Get the maximum amount of tokens
 *
 */
BozukoNothingMethod.prototype.getMaxTokens = function(){
    return this.config.tokens;
}

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
BozukoNothingMethod.prototype.getTokenCount = function(){
    return this.config.tokens;
}

BozukoNothingMethod.prototype.getButtonText = function( tokens, callback ){
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
                return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/bozuko/play' ));
            }
            return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/bozuko/play' ) );
        });
    });
};
