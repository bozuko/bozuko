var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    EntryConfig = require('./embedded/contest/entry/config'),
    Prize = require('./embedded/contest/prize'),
    Play = require('./embedded/contest/play'),
    ObjectId = Schema.ObjectId,
    Native = require('./plugins/native'),
    async = require('async'),
    ObjectID = require('mongoose/lib/mongoose/types/objectid'),
    uuid = require('node-uuid')
;

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
    engine_type             :{type:String, default:'order'},
    entries                 :[],
    plays                   :[Play],
    game                    :{type:String},
    game_config             :{},
    rules                   :{type:String},
    entry_config            :[EntryConfig],
    prizes                  :[Prize],
    consolation_prizes      :[Prize],
    free_play_pct           :{type:Number},
    total_free_plays        :{type:Number},
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
    var self = this;

    self.getEngine().generateResults(this);
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

    if (user) {
        var tokens = 0;
        var lastEntry = null;
        // how many tokens ?
        this.entries.forEach(function(entry){
            // check timestamp and user_id
            var now = new Date();
            if (entry.user_id == String(user._id)) {
                lastEntry = entry;
            }
            if( entry.user_id == String(user._id) && entry.timestamp.getTime()+Bozuko.config.entry.token_expiration > now.getTime() ){
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
        return entryMethod.getNextEntryTime( lastEntry, function(error, time){
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

Contest.method('addEntry', function(entry, callback) {
    Bozuko.models.Contest.findAndModify(
        { _id: this._id, token_cursor: {$lt : this.total_plays - entry.tokens}},
        [],
        {$inc : {'token_cursor': entry.tokens}, $push : {'entries' : entry}},
        {new: true},
        function(err, contest) {
            if (err) return callback(err);
            if (!contest) {
                return callback(Bozuko.error('entry/not_enough_tokens'));
            }
            return callback(null, entry);
        }
    );

});

Contest.static('audit', function(callback) {
    // find all contests with active plays
    return Bozuko.models.Contest.find({'plays.active' : true}, function(err, contests) {
        console.log("err = "+err);
        console.log("contests = "+contests);
        if (err) return callback(err);
        if (!contests) return callback(null);
        if (contests.length === 0) return callback(null);

        console.log("AUDIT: "+contests.length+" contests with active plays");

        return async.forEachSeries(contests, function(contest, callback) {

            var index = -1;
            return async.forEachSeries(contest.plays, function(play, callback) {
                index++;
                if (!play.active) return callback(null);

                // Did the user win?
                var free_play = false;
                var result = contest.results[index];
                console.log("AUDIT: result = "+JSON.stringify(result));
                if (result === 'free_play') {
                    result = false;
                    free_play = true;
                }
                var winner = result ? true : false;

                function fix_play(prize) {
                    // Prize already exists. See if the play exists.
                    return Bozuko.models.Play.findOne(
                        {contest_id: contest._id, play_cursor: index},
                        function(err, p) {
                            if (err) return callback(err);
                            if (!p) {
                                var game_result = Bozuko.game( contest ).process( result ? result.index : false );
                                return contest.savePlay(play.user_id, index, play.timestamp, play.uuid, game_result, prize, free_play, callback);
                            }
                            // We already the play saved, so just remove the active flag.
                            play.active = false;
                            return contest.save(function(err) {
                                if (err) return callback(err);
                                return callback(null);
                            });
                        }
                    );
                }

                if (winner) {
                    // The user won so there should be a prize and play record
                    return Bozuko.models.Prize.findOne(
                        {contest_id: contest._id, play_cursor: index},
                        function(err, prize) {
                            if (err) return callback(err);
                            if (!prize) {
                                return contest.savePrize(play.user_id, index, play.timestamp, play.uuid, callback);
                            }
                            // The prize record already exists so check the play record
                            return fixPlay(prize);
                        }
                    );
                }

                // The user didn't win so there should only be a play record
                return  fix_play(null);
        },
        function(err) {
            callback(err);
        });
    },
    function(err) {
        callback(err);
    });
    });
});

Contest.method('play', function(user_id, callback){
    this.startPlay(user_id, callback);
});

Contest.method('startPlay', function(user_id, callback) {
    var self = this;

    var now = new Date();
    var min_expiry_date = new Date(now.getTime() - Bozuko.config.entry.token_expiration);
    var _uuid = uuid();
    Bozuko.models.Contest.findAndModify(
        {_id: this._id, entries: {$elemMatch: {tokens : {$gt : 0}, timestamp : {$gt : min_expiry_date}, user_id: user_id} }},
        [],
        {$inc : {"entries.$.tokens" : -1, play_cursor: 1},
            $push : {plays: {timestamp: now, active: true, uuid: _uuid, user_id: user_id}}},
        {new: true},
        function(err, contest) {
            if (err) return callback(err);
            if (!contest) return callback(Bozuko.error("contest/no_tokens"));
            return self.savePrize(user_id, contest.play_cursor, now, _uuid, callback);
        }
    );
});

Contest.method('savePrize', function(user_id, play_cursor, timestamp, _uuid, callback) {
    var self = this;
    var game_result;
    var free_play = false;

    var result = this.results[play_cursor];
    if (result === 'free_play') {
        game_result = Bozuko.game(this).process(false);
        free_play = true;
        return self.savePlay(user_id, play_cursor, timestamp, _uuid, game_result, null, free_play, callback);
    }

    game_result =  Bozuko.game( this ).process( result ? result.index : false );
    var prize_index =  result ? result.index : false;

    if( prize_index !== false ){
        // get the actual prize
        var prize = self.prizes[prize_index];

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
                uuid: _uuid,
                value: prize.value,
                page_name: page.name,
                name: prize.name,
                timestamp: timestamp,
                status: 'active',
                instructions: prize.instructions,
                expires: expires,
                play_cursor: play_cursor,
                description: prize.description,
                redeemed: false
            });

            return user_prize.save(function(err) {
                if (err) return callback(err);
                return self.savePlay(user_id, play_cursor, timestamp, _uuid, game_result, user_prize, free_play, callback);
            });

        });

    }

    return self.savePlay(user_id, play_cursor, timestamp, _uuid, game_result, null, free_play, callback);
});

Contest.method('savePlay', function(user_id, play_cursor, timestamp, _uuid, game_result, prize, free_play, callback) {
    var self = this;
    var play = new Bozuko.models.Play({
        contest_id: this._id,
        page_id: this.page_id,
        user_id: user_id,
        uuid: _uuid,
        play_cursor:  play_cursor,
        timestamp: timestamp,
        game: this.game,
        win: prize ? true : false,
        free_play: free_play
    });

    if (prize) {
        play.prize_id = prize._id;
        play.prize_name = prize.name;
    }

    return play.save(function(err) {
        if (err) return callback(err);
        return self.endPlay(timestamp, game_result, play, prize, free_play, callback);
    });
});

Contest.method('endPlay', function(timestamp, game_result, play, prize, free_play, callback) {
    var self = this;

    function handler(err, contest) {
        if (err) return callback(err);
        return callback(null, {
            contest: contest,
            play: play,
            game_result: game_result,
            prize: prize,
            free_play: free_play
        });
    }
    var min_expiry_date = new Date(timestamp.getTime() - Bozuko.config.entry.token_expiration);

    if (free_play) {

        // Need to use 2 findAndModify operations here, because mongo doesn't seem to allow
        // updating of two different arrays in the same doc.
        // Whatf mantastic fun discovering that was!
        return Bozuko.models.Contest.findAndModify(
            {_id: this._id, entries: {$elemMatch: {timestamp : {$gt : min_expiry_date}, user_id: play.user_id}} },
            [],
            {$inc: {'entries.$.tokens': 1, token_cursor: 1}},
            {new: true},
            function(err, contest) {
                return Bozuko.models.Contest.findAndModify(
                    {_id: self._id, 'plays.uuid': play.uuid},
                    [],
                    {$set: {'plays.$.active' : false}},
                    {new: true},
                    handler
                );
            }
        );
    }

    return Bozuko.models.Contest.findAndModify(
        {_id: this._id, plays: {$elemMatch : {timestamp: timestamp, uuid: play.uuid}}},
        [],
        {$set: {'plays.$.active' : false}},
        {new: true},
        handler
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
