var EntryMethod = Bozuko.require('core/contest/entry'),
    _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date'),
    burl = Bozuko.require('util/url').create,
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
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
FacebookLikeMethod.prototype.image = burl('/images/entry/facebook.png');

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
FacebookLikeMethod.prototype.getDescription = function(callback){
    var self = this;
    
    return self.load(function(error){
        // need a nice duration
        // get the number of minutes:
        var duration = DateUtil.duration( self.config.duration, true );
        var description = "Like us on Facebook\n";
            description+= self.config.tokens+" "+(self.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;
            
        if( !self.user || (self.page && !self.user.likes(self.page))){
            description+="\n\nHit back and scroll down to like us."
        }
    
        return callback(error, description);
    });
};

/**
 * Get Description - allow for formatting.
 *
 */
FacebookLikeMethod.prototype.getHtmlDescription = function(){
    var self = this;

    var duration = DateUtil.duration( self.config.duration, true );
    var description = "Like us on Facebook and get ";
        description+= self.config.tokens+" "+(self.config.tokens > 1 ? "plays" : "play" )+" every "+duration+'.';
        
    return description;
};

FacebookLikeMethod.prototype.getEntryRequirement = function(){
    return 'Must "Like" this pages Facebook page to enter. ';
};

/**
 * Get the maximum amount of tokens
 *
 */
FacebookLikeMethod.prototype.getMaxTokens = function(){
    return this.config.tokens;
};

/**
 * Get the number of tokens for this user on a successfull entry
 *
 */
FacebookLikeMethod.prototype.getTokenCount = function(){
    return this.config.tokens;
};

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
    
    return EntryMethod.prototype.process.call(self, function(error, entry){
        if( error ) return callback( error );
        // this might be a share...
        // we only count one "like" per person, so just their first one.
        return Bozuko.models.Share.count({user_id: self.user.id, service:'facebook', type:'like'}, function(error, count){
            if( error ) return callback( error );
            if( count ) return callback( null, entry );
            var share = new Bozuko.models.Share({
                service         :'facebook',
                type            :'like',
                contest_id      :self.contest.id,
                page_id         :self.contest.page_id,
                user_id         :self.user.id,
                visibility      :0
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
};

FacebookLikeMethod.prototype.validate = function( callback ){
    var self = this;
    self.load(function(error){
        if( error ) return callback(error);
        if( !self.user || !self.page || !self.user.likes(self.page) ){
            return callback(null, false);
        }
        return EntryMethod.prototype.validate.call(self, callback);
    });
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
        return self.getNextEntryTime( function( error, time ){

            if( error ) return callback( error );
            if( !tokens ){
                
                var now = new Date();
                if( +time > +now ){
                    text = _t( self.user ? self.user.lang : 'en', 'entry/facebook/wait_duration', DateUtil.inAgo(time) );
                }
                else if( self.user ){
                    if( !self.user.likes(self.page) ){
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
    if( tokens ) return callback( null, true );
    self.getNextEntryTime( function(error, time){
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

