var Engine = Bozuko.require('core/contest/engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits;

var OrderEngine = module.exports = function(){
    Engine.apply(this, arguments);
};
inherits( OrderEngine, Engine );

OrderEngine.prototype.generateResults = function( ){
    
    var contest = this.contest;
    var results = {};

    var prizes = contest.prizes;
    // sort the prizes by value
    prizes.sort( function(a, b){
        return b.value - a.value;
    });

    var max=0;
    contest.entry_config.forEach(function(entry_config){
        var entryMethod = Bozuko.entry(entry_config.type, contest);
        entryMethod.configure( entry_config );
        max = Math.max(parseInt(entryMethod.getMaxTokens()),max);
    });

    // var totalPlays = max*contest.total_entries;
    var totalPlays = contest.total_plays;
    
    // not sure if this is the best way to do this, but it works
    var ar = [];
    for( var i=0; i<totalPlays; i++) ar.push(i);


    prizes.forEach(function(prize, prize_index){
        for( var i = 0; i < prize.total; i++ ){
            // get a random number
            var random = rand(0,ar.length-1);
            var index = ar[random];
            
            ar.splice( random, 1 );
            results[index] = {
                index: prize_index,
                prize: prize._id
            };
        }
    });
    delete ar;

    contest.results = results;
    contest.total_plays = totalPlays;
}

OrderEngine.prototype.play = function( user_id, callback ){
    var tries = this.contest.total_plays - this.contest.play_cursor;
    this.startPlay(user_id, tries, callback);
};
/*
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
*/