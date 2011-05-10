var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    EntryConfig = require('./embedded/contest/entry/config'),
    Prize = require('./embedded/contest/prize'),
    ObjectId = Schema.ObjectId,
    Native = require('./plugins/native'),
    async = require('async')
;

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
    version                 :{type:Number, default: 0},
    engine_type             :{type:String, default:'order'},
    users                   :{},
    game                    :{type:String},
    game_config             :{},
    rules                   :{type:String},
    entry_config            :[EntryConfig],
    prizes                  :[Prize],
    consolation_prizes      :[Prize],
    free_spins              :{type:Number},
    active                  :{type:Boolean},
    start                   :{type:Date},
    end                     :{type:Date},
    total_entries           :{type:Number},
    total_plays             :{type:Number},
    results                 :{},
    play_cursor             :{type:Number, default: -1},
    token_cursor            :{type:Number, default: -1},
    winners                 :[ObjectId]
});

Contest.plugin( Native );

/**
 * Create the results array
 *
 * @public
 */
Contest.method('generateResults', function(callback){
    this.getEngine().generateResults(this);
    var self = this;
    this.save(function(error){
        if( error ) return callback(error);
        return callback(null, self.results);
    });
});

/**
 * Enter a contest
 *
 * @param {Entry}
 *
 * @public
 * Note that the entry param is not an entry model, it is an Entry defined in
 * core/contest/entry.js
 */
Contest.method('enter', function(entry, callback){

    var self = this;
    // get the entry_config
    var cfg = null, found=false;
    for(var i=0; i<this.entry_config.length && found == false; i++){
        if( this.entry_config[i].type == entry.type ){
            cfg = this.entry_config[i];
            found = true;
        }
    }
    if( !found ) return callback( Bozuko.error('contest/invalid_entry_type', {contest:this, entry:entry}) );
    entry.setContest(this);
    entry.configure(cfg);
    return entry.process( callback );
});

Contest.method('getEngine', function(){
    if( !this._engine ){
        var type = String(this.engine_type);
        if( type == '') type = 'order';
        var Engine = Bozuko.require('core/contest/engine/'+type);
        this._engine = new Engine( this );
    }
    return this._engine;
});

Contest.method('getListMessage', function(){
    var config = this.entry_config[0];
    var entryMethod = Bozuko.entry( config.type );
    return entryMethod.getListMessage();
});

Contest.method('getEntryMethodDescription', function(){
    var config = this.entry_config[0];
    var entryMethod = Bozuko.entry( config.type );
    entryMethod.configure( config );
    entryMethod.setContest( this );
    return entryMethod.getDescription();
});

Contest.method('loadGameState', function(user, callback){

    var self =this;

    // we need to create an entry to see whats up...
    var config = this.entry_config[0];
    var entryMethod = Bozuko.entry(config.type, user);
    entryMethod.setContest(this);
    entryMethod.configure(config);

    var state = {
        user_tokens: 0,
        next_enter_time: new Date(),
        button_text: '',
        button_enabled: true,
        button_action: 'enter',
        contest: self
    };

    // how many tokens
    var contest_user = user && self.users ? self.users[user.id] : false;
    if( contest_user ){
        var tokens = 0;
        contest_user.entries.forEach(function(entry){
            // check timestamp
            var now = new Date();
            if( entry.timestamp.getTime()+Bozuko.config.entry.token_expiration > now.getTime() ){
                // we should be good
                tokens += entry.tokens;
            }
        });
        // okay, have all the tokens
        state.user_tokens = tokens;
    }

    entryMethod.getButtonText( state.user_tokens, function(error, text){
        if( error ) return callback(error);
        state.button_text= text;
        return entryMethod.getNextEntryTime( function(error, time){
            if( error ) return callback( error );
            state.next_enter_time = time;
            
            return entryMethod.getButtonEnabled( state.user_tokens, function(error, enabled){
                if( error ) return callback( error);
                state.button_enabled = enabled;
                self.game_state = state;
                return callback(null, state);
            });
            
        });
    });
});

Contest.method('loadEntryMethod', function(user, callback){
    var self =this;

    // we need to create an entry to see whats up...
    var config = this.entry_config[0];
    var entryMethod = Bozuko.entry(config.type, user);
    entryMethod.setContest(this);
    entryMethod.configure(config);

    self.entry_method = entryMethod;
    callback( null, entryMethod );

});

Contest.method('loadTransferObject', function(user, callback){
    var self = this;
    return self.loadGameState(user, function(error){
        if( error ) return callback(error);
        return self.loadEntryMethod(user, function(error){
            if( error ) return callback(error);
            return callback( null, this);
        });
    });
});


Contest.method('addUserEntry', function(user_id, entry, tries, callback) {

    var self = this;

    // Ensure that the contest isn't out of tokens
    if (this.token_cursor + entry.tokens >= this.total_plays) {
        return callback( Bozuko.error('entry/not_enough_tokens') );
    }

    if (!this.users) this.users = {};

    // Add the entry to the users object
    if (this.users[user_id]) {
        this.users[user_id].entries.push(entry);
    } else {
       this.users[user_id] = {
           active_plays: [],
           entries: [entry]
       };
    }

    return Bozuko.models.Contest.update(
        {_id: this._id, version: this.version},
        {token_cursor: this.token_cursor+entry.tokens, users: this.users, version: this.version+1},
        function(err) {
            if (err) {
                if (tries === 0)  return callback(Bozuko.error('entry/db_error'));
                return Bozuko.models.Contest.findById(self._id, function(e, c) {
                    if (e) return callback(e);
                    if (!c) return callback(Bozuko.error('contest/not_found', self));
                    return c.addUserEntry(user_id, entry, tries-1, callback);
                });
            }
            return callback(null, entry);
        }
    );
});

Contest.static('audit', function(callback) {
    return Bozuko.models.Contest.find({}, function(err, contests) {
        if (err) return callback(err);
        if (!contests) return callback(null);
        return async.forEachSeries(contests, function(contest, callback) {

            var uids = Object.keys(contest.users);
            if (uids.length == 0) return callback(null);

            return uids.forEach(function(user_id) {

                if (contest.users[user_id].active_plays.length == 0) return callback(null);

                return contest.users[user_id].active_plays.forEach(function(active_play) {

                    if (active_play.prize_index != false) {
                    // The user won so there should be a prize and play entry
                        Bozuko.models.Prize.findOne(
                            {contest_id: contest._id, play_cursor: active_play.play_cursor},
                            function(err, prize) {
                                if (err) return callback(err);
                                if (!prize) {
                                    return contest.savePrize(user_id, active_play, callback);
                                }
                                return Bozuko.models.Play.findOne(
                                    {contest_id: contest._id, play_cursor: active_play.play_cursor},
                                    function(err, play) {
                                        if (err) return callback(err);
                                        if (!play) {
                                            return contest.savePlay(user_id, active_play, prize, callback);
                                        }
                                        // Both prize and play already exist - nothing to fix
                                        return callback(null);
                                    }
                                );
                            }
                        );

                    } else {
                    // The user lost so there should only be a play entry
                        Bozuko.models.Play.findOne(
                            {contest_id: contest._id, play_cursor: active_play.play_cursor},
                            function(err, play) {
                                if (err) return callback(err);
                                if (!play) {
                                    return contest.savePlay(user_id, active_play, null, callback);
                                }
                                // play already exists - nothing to fix
                                return callback(null);
                            }
                        );
                    }
                });
            });

        },
        function(err) {
            callback(err);
        });
    });
});

Contest.method('play', function(user_id, callback){
    var tries = this.total_plays - this.play_cursor;
    this.startPlay(user_id, tries, callback);
});

Contest.method('startPlay', function(user_id, tries, callback) {
    var self = this;
    var user = this.users[user_id];
    if (!user) return callback( Bozuko.error("contest/unknown_user"), user_id);
    if (tries === 0) {
        return callback(Bozuko.error("contest/db_update"));
    }

    var tokens_available = false;
    for (var i = 0; i < user.entries.length && !tokens_available; i++) {
        var entry = user.entries[i];
        var now = new Date();
        if (entry.tokens > 0 && entry.timestamp.getTime()+Bozuko.config.entry.token_expiration > now.getTime() ) {
            entry.tokens--;
            tokens_available = true;
        }
    }

    if (!tokens_available) return callback(Bozuko.error("contest/no_tokens"));

    var result = this.results[String(this.play_cursor+1)];
    var active_play = {
        play_cursor: this.play_cursor+1,
        game_result: Bozuko.game( this ).process( result ? result.index : false ),
        prize_index: result ? result.index : false,
        timestamp: new Date()
    };
    user.active_plays.push(active_play);

    return Bozuko.models.Contest.update(
        {_id: this._id, version: this.version},
        {play_cursor: this.play_cursor+1, users: this.users, version: this.version+1},
        function(err) {
            if (err) {
                return Bozuko.models.Contest.findById(self._id, function(e, c) {
                    if (e) return callback(e);
                    if (!c) return callback(Bozuko.error('contest/not_found', self));
                    return setTimeout(function() {
                        c.startPlay(user_id, tries-1, callback);
                    }, Math.floor(Math.random()*20));
                });
            }
            return self.savePrize(user_id, active_play, callback);
        }
    );
});

Contest.method('savePrize', function(user_id, active_play, callback) {
    var self = this;

    if( active_play.prize_index != false ){
        // get the actual prize
        var prize = self.prizes[active_play.prize_index];

        if (!prize) return callback(Bozuko.error('contest/no_prize'));

        return Bozuko.models.Page.findById( self.page_id, function(error, page){
            if( error ) return callback( error );
            if( !page ){
                return callback( Bozuko.error('contest/save_prize_no_page') );
            }
            // lets add the prize for this user
            var expires = new Date();
            expires.setTime( expires.getTime() + prize.duration );
            var user_prize = new Bozuko.models.Prize({
                contest_id: self._id,
                page_id: self.page_id,
                user_id: user_id,
                value: prize.value,
                page_name: page.name,
                name: prize.name,
                timestamp: active_play.timestamp,
                status: 'active',
                instructions: prize.instructions,
                expires: expires,
                play_cursor: active_play.play_cursor,
                description: prize.description,
                redeemed: false
            });

            return user_prize.save(function(err) {
                if (err) return callback(err);
                return self.savePlay(user_id, active_play, user_prize, callback);
            });

        });

    }

    return self.savePlay(user_id, active_play, null, callback);
});

Contest.method('savePlay', function(user_id, active_play, prize, callback) {
    var self = this;
    var play = new Bozuko.models.Play({
        contest_id: this._id,
        page_id: this.page_id,
        user_id: user_id,
        play_cursor:  active_play.play_cursor,
        timestamp: active_play.timestamp,
        game: this.game,
        win: prize ? true : false
    });

    if (prize) {
        play.prize_id = prize._id;
        play.prize_name = prize.name;
    }

    return play.save(function(err) {
        if (err) return callback(err);
        return self.endPlay(user_id, active_play, play, prize, 10, callback);
    });
});

Contest.method('endPlay', function(user_id, active_play, play, prize, tries, callback) {
    var self = this;

    if (tries === 0) return callback(Bozuko.error("contest/db_update"));

    var user = this.users[user_id];
    var play_index = user.active_plays.indexOf(active_play);
    user.active_plays.splice(play_index, 1);

    return Bozuko.models.Contest.update(
        {_id: this._id,  version: this.version},
        {users: this.users, version: this.version+1},
        function(err) {
            if (err) {
                return Bozuko.models.Contest.findById(self._id, function(e, c) {
                    if (e) return callback(e);
                    if (!c) return callback(Bozuko.error('contest/not_found', self));
                    return setTimeout(function() {
                        c.endPlay(user_id, active_play, play,  prize, tries-1, callback);
                    }, Math.floor(Math.random()*20));
                });
            }
            return callback(null, {
                play: play,
                game_result: active_play.game_result,
                prize: prize
            });
        }
    );
});

Contest.method('getGame', function(){
    return Bozuko.game( this );
});

Contest.method('getBestPrize', function(){
    if( this.prizes.length == 0 ) return null;
    var prizes = this.prizes;
    prizes.sort( function(a, b){
        return b.value - a.value;
    });
    return prizes[0];
});
