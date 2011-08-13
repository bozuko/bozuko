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
var FacebookCheckinMethod = module.exports = function(key, user, options){
    options = options || {};
    EntryMethod.call(this,key,user);
    // set the valid options
    this.options = options;
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
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
FacebookCheckinMethod.prototype.image = burl('/images/entry/facebook.png');

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
    options:{
        enable_like: false
    }
};


/**
 * Get Description - allow for formatting.
 *
 */
FacebookCheckinMethod.prototype.getDescription = function(callback){
    var self = this;
    // need a nice duration
    // get the number of minutes:
    self.load(function(error){
        var duration = DateUtil.duration(self.config.duration, true);
        var description = "Check In on Facebook\n";
            description+= self.config.tokens+" "+(self.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;
        if( self.config.options.enable_like ){
            var play = (self.config.tokens > 1 ? "Plays" : "Play" );
            description+= "\nLike us for "+self.config.tokens+" Bonus "+play+"!";
            if( !self.user || (self.page && !self.user.likes( self.page )) ){
                description+="\nHit back and scroll down to like us.";
            }
        }
        return callback(error, description);
    });
};

/**
 * Get Description - allow for formatting.
 *
 */
FacebookCheckinMethod.prototype.getHtmlDescription = function(){
    var self = this,
        duration = DateUtil.duration(self.config.duration, true),
        description = "Check in on Facebook and get ";
        description+= self.config.tokens+" "+(self.config.tokens > 1 ? "plays" : "play" )+" every "+duration+'.';
        
    if( self.config.options.enable_like ){
        var play = (self.config.tokens > 1 ? "plays" : "play" );
        description+= "\nGet "+self.config.tokens+" bonus "+play+" if you Like us on Facebook!";
    }
    return description;
};



FacebookCheckinMethod.prototype.getEntryRequirement = function(){
    return "Player must \"check in\" with Facebook to enter.";
}

FacebookCheckinMethod.prototype.getPlayLimitations = function(){
    var str = EntryMethod.prototype.getPlayLimitations.apply(this);
    if( this.config.options.enable_like ){
        str+=' An additional '+(this.config.tokens > 1 ? "plays" : "play" )+' offered to users who "Like" this page on Facebook.';
    }
    return str;
}
/**
 * Get the maximum amount of tokens
 *
 */
FacebookCheckinMethod.prototype.getMaxTokens = function(){
    return this.config.tokens + (this.config.options.enable_like ? this.config.tokens : 0);
}

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
FacebookCheckinMethod.prototype.getTokenCount = function(){
    if( !this.contest || !this.user) return this.config.tokens;
    var tokens = this.config.tokens;

    if( this.config.options.enable_like && this.user ){
        if( this.user.likes( this.page ) ){
            tokens += this.config.tokens;
        }
    }
    return tokens;
}

FacebookCheckinMethod.prototype.validate = function( callback ){
    var self = this;
    EntryMethod.prototype.validate.call(self, function(error, valid){
        if( error || !valid ) return callback( error, valid );
        
		//console.error('FacebookCheckinMethod::validate - parent::validate.valid:'+
		//	(valid?'true':'false')
		//);
		
        /**
         * If a user cannot check in, check to make sure that the user has at least checked in here within
         * the configured duration for a page check in
         */
		//console.error('FacebookCheckinMethod::validate - self.can_checkin:'+
		//	(self.can_checkin?'true':'false')+', self.hasCheckedIn():'+
		//	(self.hasCheckedIn()?'true':'false')
		//);
        if( !self.can_checkin && !self.hasCheckedIn() ){
			console.error('FacebookCheckinMethod::validate - returning false');
            return callback(null, false);
        }
		//console.error('FacebookCheckinMethod::validate - returning true');
        return callback( null, true);
    });
};

FacebookCheckinMethod.prototype.hasCheckedIn = function(){
    var self = this;
	
	//console.error('FacebookCheckinMethod::hasCheckedIn - self.last_checkin_here:'+
	//	(self.last_checkin_here?'true':'false')
	//);
	
	
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
FacebookCheckinMethod.prototype.process = function( callback ){
    var self = this;

    return self.validate( function(error, valid){
        if( error ) return callback( error );
        if( !valid ){
			
			// console.error('FacebookCheckinMethod::process - self.validate:false');
			
            if(!self.can_checkin && !self.hasCheckedIn()){
                
				// console.error('FacebookCheckinMethod::process - self.validate returning too_many_attempts_per_user');
                return self.page.getNextCheckinTime( self.user, function(error, next_time){
                    if( error ) return callback( error );
                    return callback( Bozuko.error('checkin/too_many_attempts_per_user', {next_time: next_time}) );
                });
            }
			// console.error('FacebookCheckinMethod::process - self.validate returning invalid_entry');
            return callback( Bozuko.error('contest/invalid_entry') );
        }
		// console.error('FacebookCheckinMethod::process - self.validate():true');

        if( self.can_checkin ){
			// console.error('FacebookCheckinMethod::process - self.can_checkin:true');
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
        // console.error('FacebookCheckinMethod::process - processing');
        return EntryMethod.prototype.process.call(self, callback);
    });
};

FacebookCheckinMethod.prototype._load = function( callback ){
    var self = this;
   
    if( !self.user ){
        self.can_checkin = true;
        return callback( null );
    }
    
    return self.page.canUserCheckin( self.user, function(error, flag, checkin, error2){
        if( error ) return callback( error );
        self.can_checkin = flag;
        
		// if( self.can_checkin ) return callback(null);
        
		var date = new Date(
            Date.now() - Bozuko.cfg('checkin.duration.page', 1000 * 60 * 60 * 4)
        );
		
		var selector = {
            service:'facebook',
			user_id: self.user._id,
            page_id: self.page._id,
            timestamp: {$gt: date}
        };
		
		// console.error('FacebookCheckinMethod::_load - selector for last_checkin_here: '+inspect(selector));
		
        return Bozuko.models.Checkin.findOne(selector, function(error, checkin){
            if( error ) return callback( error );
            //console.error( 'last checkin here: '+inspect( checkins ) );
            self.last_checkin_here = checkin;
			//console.error('FacebookCheckinMethod::_load - last_checkin_here: '+JSON.stringify(self.last_checkin_here));
            return callback( null );
        });
    });
};

FacebookCheckinMethod.prototype.getButtonText = function( tokens, callback ){
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
				
				//console.error('FacebookCheckinMethod::getButtonText - self.can_checkin:'+
				//	(self.can_checkin?'true':'false')+', self.hasCheckedIn():'+
				//	(self.hasCheckedIn()?'true':'false')
				//);
				
                if( self.user && !self.can_checkin && self.hasCheckedIn() ){
                    return callback(null,  _t( self.user ? self.user.lang : 'en', 'entry/facebook/enter' )  );
                }
                return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/checkin_to_play' ));
            }
            return callback(null, _t( self.user ? self.user.lang : 'en', 'entry/facebook/play' ) );
        });
    });

};
