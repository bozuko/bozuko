var mongoose = require('mongoose'),
    // Engine = Bozuko.require('core/contest/engine'),
    Schema = mongoose.Schema,
    EntryConfig = require('./embedded/contest/entry/config'),
    Prize = require('./embedded/contest/prize'),
    // ContestPlay = require('./embedded/contest/play'),
    ObjectId = Schema.ObjectId
;

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
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
            callback(error);
        }
        else entry.process( function(error, Entry){
            // this will return an Entry model object on success.
            callback(error, Entry);
        });
    });
});

Contest.method('incrementPlayCursor', function(callback) {
    var self = this;
    if (this.total_plays - this.play_cursor === 1) {
        return callback( Bozuko.error('contest/incrementing_play_cursor', self) );
    }
    Bozuko.models.Contest.update(
        {_id:self._id, play_cursor:self.play_cursor},
        {play_cursor: self.play_cursor + 1},
        function(error, object){
            if( error ){
                return Bozuko.models.Contest.findById( self._id, function(error, contest){
                    if( error ) return callback( error );
                    if (contest.total_plays - contest.play_cursor === 1) {
                        return callback( Bozuko.error('contest/incrementing_play_cursor', self) );
                    }
                    return contest.incrementPlayCursor(callback);
                });
            }
            self.play_cursor++;
            return callback( null, self.play_cursor );
        }
    );
});

function add_play(game_result, user, contest, entry, prize, callback) {
    // record the "Play" in our db, win or lose
    var play = new Bozuko.models.Play();
    play.set('user_id', user._id);
    play.set('page_id', contest.page_id);
    play.set('contest_id', contest._id);
    play.set('entry_id', entry._id);
    play.set('timestamp', new Date());
    play.set('game', contest.game);
    play.set('win', prize ? true : false);

    if (prize) {
        play.set('prize_id', prize._id);
        play.set('prize_name', prize.get('name'));
    }

    play.save( function(error){
        if( error ) return callback( error );
        return callback(null, {
            entry: entry,
            play: play,
            game_result: game_result,
            prize: prize ? prize : false
        });
    });
}

Contest.method('play', function(user, callback){
    var self = this;

    // Find an entry for this contest that still has tokens
    Bozuko.models.Entry.findOne(
        {user_id:user.id, contest_id:this.id, tokens: {$gt:0}},
        function(error, entry){
            if( error ){
                return callback( error );
            }
            else if( !entry ){
                return callback( Bozuko.error("contest/no_tokens") );
            }

            return entry.decrementTokens(function(error, numtokens) {
                // TODO: If the tokens reach 0 (an error is returned) then re-do the entry search
                // to see if any other entries for this contest have tokens
                if ( error ) return callback ( error );

                self.incrementPlayCursor( function(error, index){

                    if( error ) return callback( error );

                    // now lets process the result
                    var result = self.results[''+index];

                    if( error ) return callback( error );

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

                        // lets add the prize for this user
                        var user_prize = new Bozuko.models.Prize();

                        user_prize.user_id = user._id;
                        user_prize.page_id = self.page_id;
                        user_prize.contest_id = self._id;
                        user_prize.value = prize_object.value;
                        user_prize.name = prize_object.name;
                        user_prize.image = prize_object.image;
                        user_prize.description = prize_object.description;
                        user_prize.instructions = prize_object.instructions;
                        user_prize.redeemed = false;

                        return user_prize.save( function(error){
                            if( error ) return callback( error );
                            add_play(game_result, user, self, entry, user_prize, callback);
                        });

                    }
                    add_play(game_result, user, self, entry, false, callback);

                });

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