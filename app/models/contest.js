var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    EntryConfig = require('./embedded/contest/entry/config'),
    Prize = require('./embedded/contest/prize'),
    ObjectId = Schema.ObjectId,
    async = require('async')
;

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
    version                 :{type:Number, default: 0},
    users                   :{},
    game                    :{type:String},
    game_config             :{},
    entry_config            :[EntryConfig],
    prizes                  :[Prize],
    start                   :{type:Date},
    end                     :{type:Date},
    total_entries           :{type:Number},
    total_plays             :{type:Number},
    results                 :{},
    play_cursor             :{type:Number, default: -1},
    token_cursor            :{type:Number, default: -1},
    winners                 :[ObjectId]
});

/**
 * Create the results array
 *
 */
Contest.method('generateResults', function(callback){
    Bozuko.require('core/contest/engine').generateResults(this);
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
    return entry.validate( function(error){
        if( error ){
            // yikes
            return callback(error);
        }

        var e = {
            timestamp: new Date(),
            type: entry.type,
            tokens: entry.getTokenCount(),
            initial_tokens: entry.getTokenCount()
        };
        var tries = self.total_plays - self.token_cursor;
        return self.addUserEntry(entry.user.id, e, tries, callback);
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
        async.forEachSeries(contests, function(contest, callback) {

            var uids = Object.keys(contest.users);
            if (uids.length == 0) return callback(null);

            uids.forEach(function(user_id) {

                if (contest.users[user_id].active_plays.length == 0) return callback(null);

                contest.users[user_id].active_plays.forEach(function(active_play) {

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
    for (var i = 0; i < user.entries.length; i++) {
        if (user.entries[i].tokens > 0) {
            user.entries[i].tokens--;
            tokens_available = true;
            break;
        }
    }

    if (!tokens_available) return callback(Bozuko.error("contest/no_tokens"));

    var result = this.results[''+this.play_cursor+1];

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
                    return c.startPlay(user_id, tries-1, callback);
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

        // lets add the prize for this user
        var user_prize = new Bozuko.models.Prize({
            contest_id: this._id,
            page_id: this.page_id,
            user_id: user_id,
            value: prize.value,
            name: prize.name,
            timestamp: active_play.timestamp,
            status: 'active',
            expires: prize.expires,
            play_cursor: active_play.play_cursor,
            description: prize.description,
            redeemed: false
        });

        return user_prize.save(function(err) {
            if (err) return callback(err);
            return self.savePlay(user_id, active_play, user_prize, callback);
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
        self.endPlay(user_id, active_play, play, prize, 10, callback);
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
                    return c.endPlay(user_id, active_play, play,  prize, tries-1, callback);
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
