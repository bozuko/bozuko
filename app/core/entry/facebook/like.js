var EntryMethod = Bozuko.require('core/entry'),
    _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date'),
    burl = Bozuko.require('util/url').create,
    dateFormat = require('dateformat'),
    inspect = require('util').inspect,
    Geo = Bozuko.require('util/geo')
;

/**
 * Facebook Checkin
 *
 */
var FacebookLikeMethod = module.exports = function(options) {
    EntryMethod.call(this, options);
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
    duration: 1000*60*60*1,
    options: {
        radius: null
    }
};

/**
 * Get list message used in 'game' transfer object
 *
 */
FacebookLikeMethod.prototype.getListMessage = function(){
    if (this.config.options.radius) return "Facebook Like and location required";
    return this.list_message;
};

/**
 * Get Description - allow for formatting.
 *
 */
FacebookLikeMethod.prototype.getDescription = function(callback){
    var self = this;

    // need a nice duration
    // get the number of minutes:
    var duration = DateUtil.duration( self.config.duration, true );
    var description = "Like us on Facebook\n";

    if (self.config.options.radius) {
        description += 'You must be within '+self.config.options.radius+ ' miles\n';
    }

    description+=self.config.tokens+" "+(self.config.tokens > 1 ? "Plays" : "Play" )+" every "+duration;

    if( !self.user || (self.page && !self.user.likes(self.page))){
        description+="\nTap Like and wait a second.";
    }

    return callback(error, description);
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
    return 'Must "Like" this page\'s Facebook page to enter. ';
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
        return Bozuko.models.Share.findOne({page_id: self.page._id, contest_id:{$exists:false}, user_id: self.user.id, service:'facebook', type:'like'}, function(error, share){
            if( error ) return callback( error );
            if( !share ) return callback(null, entry);
            share.contest_id = self.contest._id;
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

        // Only let this user enter the contest if they are within the like radius
        if (self.config.options.radius) {
            var distance = Geo.distance(self.options.ll, self.page.coords);
            if (distance > self.config.options.radius) {
                var data = {
                    user: self.user,
                    distance: Math.round(distance*10)/10,
                    radius: self.config.options.radius
                };
                return callback(Bozuko.error('entry/too_far', data));
            }
        }

        return EntryMethod.prototype.validate.call(self, callback);
    });
};

FacebookLikeMethod.prototype._load = function( callback ){
    var self = this;
    if( self.user ){
        self.user_likes = self.user.likes( self.page );
    }
    return callback();
};

FacebookLikeMethod.prototype.getButtonText = function( nextEntryTime, tokens ){
    var text = '';
    if( !tokens ){
        var now = new Date();
        if( +nextEntryTime > +now ){
            text = _t( this.user ? this.user.lang : 'en', 'entry/facebook/wait_duration', DateUtil.inAgo(nextEntryTime) );
        } else if( this.user ){
            if( !this.user.likes(this.page) ){
                text = _t( this.user ? this.user.lang : 'en', 'entry/facebook/like_enter' );
            }  else {
                text = _t( this.user ? this.user.lang : 'en', 'entry/facebook/play');
            }
        } else {
            text =  _t( this.user ? this.user.lang : 'en', 'entry/facebook/like_enter' );
        }
    } else {
        text = _t( this.user ? this.user.lang : 'en', 'entry/facebook/play' );
    }
    return text;
};

FacebookLikeMethod.prototype.getButtonEnabled = function( nextEntryTime, tokens){
    if( tokens ) return true;
    var enabled = true;
    var now = new Date();
    if( nextEntryTime > now && tokens === 0) enabled = false;
    if( enabled && this.user && !this.user.likes(this.page) ) enabled = false;
    return enabled;
};