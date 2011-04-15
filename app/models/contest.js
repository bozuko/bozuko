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
        callback(null, self.results);
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
           plays: [],
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
        contests.forEach(function(contest) {
            Object.keys(contest.users).forEach(function(user_id) {
                contest.users[user_id].active_plays.forEach(function(active_play) {

                    var play_cursor = active_play.play_cursor;

                    function auditor(model, collection) {
                        return function (callback) {
                            Bozuko.models[model].find(
                                {contest_id: contest._id, play_cursor: play_cursor},
                                function(err, models) {
                                    if (err) return callback(err);
                                    var needs_fixing = active_play[collection].filter(function(id) {
                                        var found = false;
                                        for (var i = 0; i < models.length; i++) {
                                            if (models[i]._id === id) {
                                                found = true;
                                                break;
                                            }
                                        }
                                        return !found;
                                    });
                                    return fix(model, needs_fixing, callback);
                                });
                            };

                    async.parallel([auditor('Play', 'plays'), auditor('Prize', 'prizes')], function(err, results) {
                        if (err) return callback(err);
                        var active_plays = contest.users[user_id].active_plays.filter(function(val) {
                            return val != play_cursor;
                        });
                        return callback(null);
                    });
                });
            });
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

    user.active_plays.push({play_cursor: this.play_cursor+1});

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
            return self.savePrize(user_id, self.play_cursor+1, callback);
        }
    );
});

Contest.method('savePrize', function(user_id, play_cursor, callback) {
    var self = this;
    var result = this.results[''+play_cursor];
    var game_result = Bozuko.game( self ).process( result ? result.index : false );
    var prize = result ? result.prize : false;

    if( prize ){
        // get the actual prize
        var prize_object = null;
        for( var i=0; i<self.prizes.length && prize_object == null; i++){
            if( self.prizes[i]._id+'' == prize ){
                prize_object = self.prizes[i];
            }
        }

        if (!prize_object) return callback(Bozuko.error('contest/no_prize'));

        // lets add the prize for this user
        var user_prize = new Bozuko.models.Prize({
            contest_id: this._id,
            page_id: this.page_id,
            user_id: user_id,
            value: prize_object.value,
            name: prize_object.name,
            timestamp: new Date(),
            status: 'active',
            expires: prize_object.expires,
            play_cursor: play_cursor,
            description: prize_object.description,
            redeemed: false
        });

        return user_prize.save(function(err) {
            if (err) return callback(err);
            return self.savePlay(user_id, play_cursor, game_result, user_prize, callback);
        });
    }

    return self.savePlay(user_id, play_cursor, game_result, null, callback);
});

Contest.method('savePlay', function(user_id, play_cursor, game_result, prize, callback) {
    var self = this;
    var play = new Bozuko.models.Play({
        contest_id: this._id,
        page_id: this.page_id,
        user_id: user_id,
        play_cursor:  play_cursor,
        timestamp: prize ? prize.timestamp : new Date(),
        game: this.game,
        win: prize ? true : false
    });

    if (prize) {
        play.prize_id = prize._id;
        play.prize_name = prize.name;
    }

    return play.save(function(err) {
        if (err) return callback(err);
        self.endPlay(user_id, play, game_result, prize, 10, callback);
    });
});

Contest.method('endPlay', function(user_id, play, result, prize, tries, callback) {
    var self = this;

    if (tries === 0) return callback(Bozuko.error("contest/db_update"));

    var user = this.users[user_id];
    var play_index = user.active_plays.indexOf(play.play_cursor);
    user.active_plays.splice(play_index, 1);

    return Bozuko.models.Contest.update(
        {_id: this._id,  version: this.version},
        {users: this.users, version: this.version+1},
        function(err) {
            if (err) {
                return Bozuko.models.Contest.findById(self._id, function(e, c) {
                    if (e) return callback(e);
                    if (!c) return callback(Bozuko.error('contest/not_found', self));
                    return c.endPlay(user_id, play, result, prize, tries-1, callback);
                });
            }
            return callback(null, {
                play: play,
                game_result: result,
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
        return a.value - b.value;
    });
    return prizes[0];
});
