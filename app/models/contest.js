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
    play_cursor             :{type:Number},
    token_cursor            :{type:Number},
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
        if( error ){
            console.log(error.message);
            return callback(error);
        }
        return Bozuko.models.Contest.findById(self.id, callback);
    });
});

/**
 * Enter a contest
 *
 * @param {User}
 * @param {EntryMethod} 
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

Contest.method('incrementPlayCursor', function(callback, tries){
    tries = tries || 0;
    var self = this;
    Bozuko.models.Contest.update(
        {_id:self._id, play_cursor:self.play_cursor},
        {play_cursor: self.play_cursor + 1},
        function(error, object){
            if( error ){
                
                // how many times have we tried to do this?
                if( tries > 10 ){
                    return callback( Bozuko.error('contest/error_incrementing_play_cursor', self) );
                }
                
                return Bozuko.models.Contest.findById( self._id, function(error, contest){
                    if( error ) return callback( error );
                    return contest.incrementPlayCursor(callback, tries+1);
                });
            }
            self.play_cursor++;
            return self.save(function(error){
                if( error ) return error;
                return callback( null, self.play_cursor );
            });
            
        }
    );
});

Contest.method('play', function(user, callback){
    var self = this;
    // first, lets find the entries for this contest
    Bozuko.models.Entry.findOne(
        {user_id:user.id, contest_id:this.id, tokens: {$gt:0}},
        function(error, entry){
            if( error ){
                return callback( error );
            }
            else if( !entry ){
                return callback( Bozuko.error("contest/no_tokens") );
            }
            // okay, we have an entry that is valid for this game
            // let's play a token, however, we need to do it asynchronosly
            return self.incrementPlayCursor( function(error, index){
                
                if( error ) return callback( error );
                
                // now lets process the result
                var result = self.results[index];
                entry.tokens--;
                
                return entry.save( function(error){
                    if( error ) return callback( error );
                    
                    var game_result = Bozuko.game( self.game, self.game_config ).process( result ? result.index : false );
                    var prize = result ? result.prize : false;
                    
                    return callback(null, {
                        entry: entry,
                        game_result: game_result,
                        prize: prize
                    });
                });
            });
        }
    );
});

Contest.method('getGame', function(){
    return Bozuko.game( this.game, this.game_config, this );
});

Contest.method('getBestPrize', function(){
    if( this.prizes.length == 0 ) return null;
    var prizes = this.prizes;
    prizes.sort( function(a, b){
        return a.value - b.value;
    });
    return prizes[0];
});