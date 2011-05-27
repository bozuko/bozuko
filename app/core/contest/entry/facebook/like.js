var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
    dateFormat = require('dateformat');

/**
 * Facebook Checkin
 *
 */
var FacebookLikeMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
};

FacebookLikeMethod.prototype.__proto__ = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
FacebookLikeMethod.prototype.name = 'Facebook Like';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
FacebookLikeMethod.prototype.description = 'Like us on facebook to play';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
FacebookLikeMethod.prototype.icon = '';

/**
 * List Message String
 *
 */
FacebookLikeMethod.prototype.list_message = 'Facebook Like required';


/**
 * Configuration defaults
 *
 */
FacebookLikeMethod.prototype.defaults = {
    duration: 1000*60*60*1
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
    var description = "Like us on Facebook\n";
        description+= this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;
    
    return description;
}


/**
 * Get the maximum amount of tokens
 *
 */
FacebookLikeMethod.prototype.getMaxTokens = function(){
    return this.config.tokens;
}

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
FacebookLikeMethod.prototype.getTokenCount = function(){
    return this.config.tokens;
}

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
FacebookLikeMethod.prototype.process = function( callback ){

    // lets process this...
    var self = this;
    return EntryMethod.prototype.process.call(self, callback);
};

FacebookLikeMethod.prototype.validate = function( callback ){
    var self = this;
    if( !self.user_likes ) return callback(null, false);
    return EntryMethod.prototype.validate.call(self, callback);
};

FacebookLikeMethod.prototype._load = function( callback ){
    var self = this;
    return Bozuko.models.Page.findById( self.contest.page_id, function(error, page){
        if( error ) return callback( error );
        if( !page ) return callback( Bozuko.error('contest/page_not_found'));
        self.page = page;
        if( self.user ){
            self.user_likes = self.user.likes( page );
        }
        return callback();
    });
};

FacebookLikeMethod.prototype.getButtonText = function( tokens, callback ){
    var self = this;
    var text = '';
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
                    text = _t( self.user ? self.user.lang : 'en', use_time ? 'entry/facebook/wait_time' : 'entry/facebook/wait_date', time_str );
                }
                else if( self.user ){
                    if( !self.user_likes ){
                        text = _t( self.user ? self.user.lang : 'en', 'entry/facebook/like_enter' );
                    }
                    else{
                        text = _t( self.user ? self.user.lang : 'en', 'entry/facebook/play');
                    }
                }
                else{
                    text =  _t( self.user ? self.user.lang : 'en', 'entry/facebook/like_enter' );
                }
            }
            else{
                text = _t( self.user ? self.user.lang : 'en', 'entry/facebook/play' );
            }
            return callback( null, text);
        });
    });
    
};

FacebookLikeMethod.prototype.getButtonEnabled = function( tokens, callback ){
    var self = this;
    self.getNextEntryTime( self.getLastEntry(), function(error, time){
        if( error ) return callback( error );
        var enabled = true;
        var now = new Date();
        if( time > now ){
            if( tokens == 0 ){
                enabled = false;
            }
        }
        if( enabled && self.user && !self.user_likes ) enabled = false;
        return callback( null, enabled );
    });
};
