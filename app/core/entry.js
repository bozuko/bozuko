var Err = require('./error'),
    transfer = require('./transfer'),
    _t = Bozuko.t,
    DateUtil = Bozuko.require('util/date')
;

var Entry = module.exports = function(opts) {
    this.type = opts.type;
    this.page = opts.page;
    this.contest = opts.contest;
    this.user = opts.user;
    this.ll = opts.ll;
    this.accuracy = opts.accuracy;
    this.page_id = opts.page ? opts.page._id : opts.page_id;
};

Entry.prototype.enter = function(callback) {
    var self = this;
    var contest = this.contest;
    var cfg = contest.getEntryConfig();
    if( cfg.type != this.type ){
        return callback( Bozuko.error('contest/invalid_entry_type', {contest:this.contest, entry:this}) );
    }
    this.configure(cfg);
    return this.process( function(err, entry_model) {
        if (err) return callback(err);

        return self.getEngine().enter(self.getTokenCount(), function(error){
            if( error ) return callback(error);
            var entry_model = new Bozuko.models.Entry();

            // TODO: remove this line. It breaks the contest model abstraction
            contest.schema.emit('entry', entry_model);

            Bozuko.publish('contest/entry',
                {contest_id: contest._id, page_id: self.page_id, user_id: self.user._id});

            self.loadEntryModel(entry_model);
            return entry_model.save( function(error){
                if (error) return callback(error);
                var opts = {user: self.user, page: self.page};
                return contest.loadGameState(opts, function(err, state) {
                    if (err) return callback(err);
                    return transfer('game_state', [state], self.user, function(err, states) {
                        if (err) return callback(err);
                        var rv = {game_state: states, entry: entry_model};
                        return callback(null, rv);
                    });
                });
            });
        });
    });

};

Entry.prototype.getEngine = function() {
    if( !this._engine ){
        var type = String(this.contest.engine_type);
        if( type == '') type = 'order';
        var Engine = require('./engine/'+type);
        this._engine = new Engine( this.contest );
    }
    return this._engine;
};

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
Entry.prototype.name = 'Abstract Entry Method';

/**
 * Description of the entry type (eg, Facebook Checkin, Bozuko Checkin, Play from Anywhere)
 */
Entry.prototype.description = 'This type of entry needs';

Entry.prototype.defaults = {
    duration: 1000*60*1
};

/**
 * Icon to display.
 *
 * TODO - decide if we need multiple types - mobile / admin, etc.
 */
Entry.prototype.image = '';


/**
 * List Message String
 *
 */
Entry.prototype.list_message = 'Nothing is required to play this game.';


/**
 * Get List Message
 *
 */
Entry.prototype.getListMessage = function(){
    return this.list_message;
};


/**
 * Get Description - allow for formatting.
 *
 */
Entry.prototype.getDescription = function(callback){
    return callback(null, this.description);
};


/**
 * Get HTML Description
 *
 */
Entry.prototype.getHtmlDescription = function(callback){
    return this.description;
};

Entry.prototype.getEntryRequirement = function(){
    return "Valid Bozuko Account is required to enter.";
};

Entry.prototype.getPlayLimitations = function(){
    return this.config.tokens+" "+(this.config.tokens > 1 ? "Plays" : "Play" )+" every "+DateUtil.duration(this.config.duration, true);
};

/**
 * Configure the entryMethod
 *
 * @param {EntryConfig} config The configuration for this entry method
 */
Entry.prototype.configure = function( config ){
    var i, self = this;
    this.config = {};
    for( var p in this.defaults ){
        this.config[p] = this.defaults[p];
    }
    if( config.toObject ){
        config = config.toObject();
    }
    for( p in config ){
        this.config[p] = config[p];
    }
};

/**
 * Get the number of tokens to apply for this entry
 *
 * @returns {Number} The number of tokens for this contest
 */
Entry.prototype.getTokenCount = function(){
    return this.config && this.config.tokens ? this.config.tokens : 1;
};

Entry.prototype.getMaxTokens = function(){
    return this.getTokenCount();
};

/**
 * Perform all necessary actions accociated with this entry method (eg, checkin, check for location, etc)
 *
 */
Entry.prototype.process = function( callback ){

    if( !this.user ) return callback(Bozuko.error('entry/process_no_user'));
    if( !this.contest ) return callback(Bozuko.error('entry/process_no_contest'));

    var self = this;
    self.validate(function(error, valid){
        if( error ) return callback(error);
        if( !valid ) return callback( Bozuko.error('contest/invalid_entry') );
        return callback( error );
    });
};

Entry.prototype.loadEntryModel = function(entry){
    entry.contest_id = this.contest._id;
    entry.page_id = this.page_id;
    entry.user_id = this.user._id;
    entry.user_name = this.user.name;
    entry.page_name = this.page ? this.page.name : null;
    entry.type = this.type;
    entry.tokens = this.getTokenCount();
    entry.initial_tokens = this.getTokenCount();
    entry.timestamp = new Date();
};

/**
 * Check to see if the configuration for this entry type is satisfied
 *
 */
Entry.prototype.validate = function( callback ){
    var self = this;
    self.load( function( error ){
        if( error ) return callback( error );
        // check for contest
        if( !self.contest ) return callback(null, false);

        // check for user
        if( !self.user ) return callback(null, false);

        // check that the engine allows entry
        if (!self.getEngine().allowEntry(self)) {
            return callback(null, false);
        }

        if( self.config && self.config.duration ){
            var opts = {
                entry_window: new Date(Date.now() - self.config.duration),
                contest_id: self.contest._id,
                user_id: self.user._id
            };
            return self.contest.allowEntry(opts, callback);
        }
        return callback( null, true );
    });
};

Entry.prototype.load = function(callback){
    var self = this,
        force = false;

    if( arguments.length > 1 ){
        callback = arguments[1];
        force = arguments[0];
    }
    // this contest should already have previous entries
    if( force || !self._loaded ){
        return self._load(function(error){
            self._loaded = true;
            return callback(error);
        });
    }
    return callback();
};

Entry.prototype._load = function( callback ){
    callback();
};

Entry.prototype.getNextEntryTime = function( lastEntry ){
    var self = this;
    var now = new Date();
    if( !self.user ) return now;
    if( !lastEntry ) return now;
    var timestamp = +lastEntry.timestamp;
    timestamp += (self.config.duration||0);
    now = Date.now();
    self._nextEntryTime = new Date(timestamp > now ? timestamp : now);
    return self._nextEntryTime;
};

Entry.prototype.getButtonText = function(nextEntryTime, tokens){
    if( !tokens ){
        var now = new Date();
	if (nextEntryTime.getTime() >= this.contest.end.getTime()) {
	    this._buttonText = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/thanks_for_playing' );
	} else if( nextEntryTime.getTime() >= now.getTime() ){
            this._buttonText = _t( this.user ? this.user.lang : 'en', 'entry/bozuko/wait_duration', DateUtil.inAgo( nextEntryTime ) );
        } else{
            this._buttonText = _t( this.user ? this.user.lang : 'en', 'entry/enter');
        }
    } else{
        this._buttonText = _t( this.user ? this.user.lang : 'en', 'entry/play');
    }
    return this._buttonText;
};

Entry.prototype.getButtonEnabled = function( nextEntryTime, tokens ){
    var enabled = true,
		now = Date.now();
		
    if( !tokens && (
		+nextEntryTime > now ||
		+this.contest.start > now ||
		+this.contest.end < now)
	) enabled = false;
	
	
	
    return enabled;
};

Entry.prototype.getButtonState = function(lastEntry, tokens, callback) {
    var self = this;
    var state = {};
    return this.load(function(error) {
        if (error) return callback(error);
        var time = self.getNextEntryTime(lastEntry);
        state.next_enter_time = time;
        state.text = self.getButtonText(time, tokens);
        state.enabled = self.getButtonEnabled(time, tokens);
        return callback(null, state);
    });
};
