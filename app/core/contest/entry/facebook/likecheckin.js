var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
    burl = Bozuko.require('util/url').create,
    inspect = require('util').inspect,
    DateUtil = Bozuko.require('util/date'),
    dateFormat = require('dateformat'),
    Profiler = Bozuko.require('util/profiler')
;

/**
 * Facebook Checkin
 *
 */
var FacebookLikeCheckinMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
    this._lastCheckin = false;
};

FacebookLikeCheckinMethod.prototype.__proto__ = EntryMethod.prototype;

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
FacebookLikeCheckinMethod.prototype.name = 'Facebook Like and Checkin';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
FacebookLikeCheckinMethod.prototype.description = 'Like a Facebook Page and Checkin to play a game.';

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
FacebookLikeCheckinMethod.prototype.icon = '';


/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
FacebookLikeCheckinMethod.prototype.image = burl('/images/entry/facebook.png');

/**
 * List Message String
 *
 */
FacebookLikeCheckinMethod.prototype.list_message = 'Facebook like and check-in required';


/**
 * Configuration defaults
 *
 */
FacebookLikeCheckinMethod.prototype.defaults = {
    duration: 1000*60*60*1
};


/**
 * Get Description - allow for formatting.
 *
 */
FacebookLikeCheckinMethod.prototype.getDescription = function(callback){
    var self = this;
    // need a nice duration
    // get the number of minutes:
    self.load(function(error){
        var duration = DateUtil.duration(self.config.duration, true);
        var description = "Like us on Facebook and Check In\n";
            description+= self.config.tokens+" "+(self.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;
        if( !self.user || (self.page && !self.user.likes(self.page))){
            description+="\nTap Like and wait a second.";
        }
        return callback(error, description);
    });
};

/**
 * Get Description - allow for formatting.
 *
 */
FacebookLikeCheckinMethod.prototype.getHtmlDescription = function(){
    var self = this,
        duration = DateUtil.duration(self.config.duration, true),
        description = "Like us on Facebook and Check in to get ";
        description+= self.config.tokens+" "+(self.config.tokens > 1 ? "plays" : "play" )+" every "+duration+'.';
        
    return description;
};



FacebookLikeCheckinMethod.prototype.getEntryRequirement = function(){
    return "Player must \"check in\" with Facebook to enter.";
};

FacebookLikeCheckinMethod.prototype.getPlayLimitations = function(){
    var str = EntryMethod.prototype.getPlayLimitations.apply(this);
    if( this.config.options.enable_like ){
        str+=' An additional '+(this.config.tokens > 1 ? "plays" : "play" )+' offered to users who "Like" this page on Facebook.';
    }
    return str;
};

/**
 * Get the maximum amount of tokens
 *
 */
FacebookLikeCheckinMethod.prototype.getMaxTokens = function(){
    return this.config.tokens + (this.config.options.enable_like ? this.config.tokens : 0);
};

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
FacebookLikeCheckinMethod.prototype.getTokenCount = function(){
    if( !this.contest || !this.user) return this.config.tokens;
    var tokens = this.config.tokens;

    if( this.config.options.enable_like && this.user ){
        if( this.user.likes( this.page ) ){
            tokens += this.config.tokens;
        }
    }
    return tokens;
};

FacebookLikeCheckinMethod.prototype.validate = function( callback ){
    var self = this;
    EntryMethod.prototype.validate.call(self, function(error, valid){
        if( error || !valid ) return callback( error, valid );
        
        if( !self.user || !self.page || !self.user.likes(self.page) ){
            return callback(null, false);
        }
        
        if( !self.can_checkin && !self.hasCheckedIn() ){
            return callback(null, false);
        }
        return callback( null, true);
    });
};

FacebookLikeCheckinMethod.prototype.hasCheckedIn = function(){
    var self = this;
	
    if( self.last_checkin_here ){
        return true;
    }
    return false;
};


/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 * The callback function accepts an error argument, true or false, and an method specific data argument (facebook checkin id)
 *
 * @param {Function} callback The callback function
 */
FacebookLikeCheckinMethod.prototype.process = function( callback ){
    var self = this;

    return self.validate( function(error, valid){
        if( error ) return callback( error );
        if( !valid ){
                        
            if(!self.can_checkin && !self.hasCheckedIn()){
                
                return callback( self.can_checkin_error );
            }

            return callback( Bozuko.error('contest/invalid_entry') );
        }

        if( self.can_checkin ){
            return self.page.checkin( self.user, {
                user: self.user,
                contest: self.contest,
                service: 'facebook',
                ll: self.options.ll,
                message: self.options.message
            }, function(error){
                if( error ) return callback( error );

                return EntryMethod.prototype.process.call(self, function(err, entry) {
                    if (err) return callback(err);
                    
                    var share = new Bozuko.models.Share({
                        service         :'facebook',
                        type            :'checkin',
                        contest_id      :self.contest.id,
                        page_id         :self.contest.page_id,
                        user_id         :self.user.id,
                        visibility      :0,
                        message         :self.options.message
                    });
                    try{
                        share.visibility = self.user.service('facebook').internal.friends.length;
                    }catch(e){
                        share.visibility = 0;
                    }
                    return share.save(function(error){
                        return callback( null, entry );
                    });
                });
            });
        }
        return EntryMethod.prototype.process.call(self, callback);
    });
};

FacebookLikeCheckinMethod.prototype._load = function( callback ){
    var self = this;
   
    if( !self.user ){
        self.can_checkin = true;
        return callback( null );
    }
    
    return self.page.canUserCheckin( self.user, function(error, flag, checkin, error2){
        if( error ) return callback( error );
        self.can_checkin = flag;
		self.can_checkin_error = error2;
        
        var date = new Date(
            Date.now() - Bozuko.cfg('checkin.duration.page', 1000 * 60 * 60 * 4)
        );
                
        var selector = {
            service:'facebook',
            user_id: self.user._id,
            page_id: self.page._id,
            timestamp: {$gt: date}
        };
                
        return Bozuko.models.Checkin.findOne(selector, function(error, checkin){
            if( error ) return callback( error );
            self.last_checkin_here = checkin;
            return callback( null );
        });
    });
};

FacebookLikeCheckinMethod.prototype.getButtonText = function( tokens, callback ){
    var self = this;
    this.load( function(error){
        if( error ) return callback( error );
        return self.getNextEntryTime( function( error, time ){

            if( error ) return callback( error );
            if( !tokens ){
                var now = new Date();
                if( time.getTime() > now.getTime() ){
                    var time_str = DateUtil.inAgo(time);
                    return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/wait_duration', time_str ) );
                }
                
                if( self.user && !self.user.likes(self.page) ){
                    return callback( null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/like_enter' ));
                }
                
                if( self.user && !self.can_checkin && self.hasCheckedIn() ){
                    return callback(null,  _t( self.user ? self.user.lang : 'en', 'entry/facebook/enter' ));
                }
                
                return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/checkin_to_play' ));
            }
            return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/play' ) );
        });
    });
};

FacebookLikeCheckinMethod.prototype.getButtonEnabled = function( tokens, callback ){
    var self = this;
    if( tokens ) return callback( null, true );
    return self.getNextEntryTime( function(error, time){
        if( error ) return callback( error );
        var enabled = true;
        var now = new Date();
        if( time > now ){
            if( tokens == 0 ){
                enabled = false;
            }
        }
        if( enabled && self.user && !self.user.likes(self.page) ) enabled = false;
        return callback( null, enabled );
    });
};