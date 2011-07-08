var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    dateFormat = require('dateformat'),
    EntryConfig = require('./embedded/contest/entry/config'),
    ConsolationConfig = require('./embedded/contest/consolation/config'),
    Prize = require('./embedded/contest/prize'),
    Play = require('./embedded/contest/play'),
    ObjectId = Schema.ObjectId,
    Native = require('./plugins/native'),
    JsonPlugin =  require('./plugins/json'),
    async = require('async'),
    ObjectID = require('mongoose/lib/mongoose/types/objectid'),
    uuid = require('node-uuid'),
    Profiler = Bozuko.require('util/profiler'),
    merge = Bozuko.require('util/merge'),
    rand = Bozuko.require('util/math').rand,
    S3 = Bozuko.require('util/s3'),
    Content = Bozuko.require('util/content'),
    barcode = Bozuko.require('util/barcode'),
    fs = require('fs'),
    burl = Bozuko.require('util/url').create,
    inspect = require('util').inspect
;

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
    name                    :{type:String},
    engine_type             :{type:String, default:'order'},
    plays                   :[Play],
    game                    :{type:String},
    game_config             :{},
    win_frequency           :{type:Number},
    auto_rules              :{type:Boolean, default: false},
    rules                   :{type:String},
    entry_config            :[EntryConfig],
    consolation_config      :[ConsolationConfig],
    prizes                  :[Prize],
    consolation_prizes      :[Prize],
    free_play_pct           :{type:Number},
    total_free_plays        :{type:Number},
    post_to_wall            :{type:Boolean, default: true},
    active                  :{type:Boolean},
    start                   :{type:Date, index: true},
    end                     :{type:Date},
    total_entries           :{type:Number},
    total_plays             :{type:Number},
    results                 :{},
    play_cursor             :{type:Number, default: -1},
    token_cursor            :{type:Number, default: 0},
    winners                 :[ObjectId]
});

Contest.ACTIVE = 'active';
Contest.PUBLISHED = 'published';
Contest.COMPLETE = 'complete';
Contest.DRAFT = 'draft';
Contest.CANCELLED = 'cancelled';

Contest.plugin( Native );
Contest.plugin( JsonPlugin );

Contest.virtual('state')
    .get(function(){
        if( !this.active ) return Contest.DRAFT;
        var now = new Date();
        if( this.play_cursor+1 >= this.total_plays ) return Contest.COMPLETE;
        if( now > this.start && now < this.end ) return Contest.ACTIVE;
        if( now < this.start ) return Contest.PUBLISHED;
        return Contest.COMPLETE;
    });


Contest.method('getOfficialRules', function(){
    if( this.rules ) return this.rules;
    if( this.auto_rules ){
        var rules = Content.get('app/rules.txt');
        var replacements = {
            start_date : dateFormat(this.start, 'mmmm dd, yyyy'),
            start_time : dateFormat(this.start, 'hh:MM TT'),
            end_date : dateFormat(this.end, 'mmmm dd, yyyy'),
            end_time : dateFormat(this.end, 'hh:MM TT'),
            age_limit : 16,
            page_url : 'https://bozuko.com/p/'+this.page_id,
            winners_list_url : 'https://bozuko.com/p/'+this.page_id+'/winners/'+this.id
        };
        var map = [
            "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", 
            "Ninth", "Tenth", "Eleventh", "Twelvth", "Thirteenth", "Fourteenth", "Fifteenth",
            "Sixteenth", "Seventeenth", 'Eighteenth', "Twentieth", "Twentyfirst", "Twentysecond",
            "Twentythird", "Twentyfouth", "Twentyfifth", "Twentysixth", "Twenthseventh", "Twentyeigth",
            "Twentyninth", "Thirtieth"
        ];
        var prizes = this.prizes.slice(),
            consolation_prizes = this.consolation_prizes.slice(),
            self = this,
            prizes_str = '';
            
        prizes.sort( function(a, b){
            return b.value - a.value;
        });
        consolation_prizes.sort( function(a, b){
            return b.value - a.value;
        });
        var total = 0;
        prizes.forEach(function(prize, i){
            var arv_str = i==0 ? 'Approximate Retail Value ("ARV")' : 'ARV';
            prizes_str+= prize.total+' '+map[i]+' Prizes. each, '+prize.name+', '+arv_str+': $'+prize.value+'. ';
            if( prize.details ) prizes_str+= prizes.details+' ';
            var gcd = getGCD( prize.total, self.total_plays );
            
            prizes_str+= 'Odds of winning are '+(prize.total/gcd)+' / '+ (self.total_plays/gcd)+'. ';
            total = prize.value * prize.total;
        });
        
        consolation_prizes.forEach(function(prize, i){
            var arv_str = i==0 ? 'Approximate Retail Value ("ARV")' : 'ARV';
            prizes_str+= prize.total+' '+map[i]+' Prizes. each, '+prize.name+', '+arv_str+': $'+prize.value+'. ';
            if( prize.details ) prizes_str+= prizes.details+' ';
            var gcd = getGCD( prize.total, self.total_plays );
            
            prizes_str+= 'Odds of winning are '+(prize.total/gcd)+' / '+ (self.total_plays/gcd)+'. ';
            total = prize.value * prize.total;
        });
        
        replacements.prizes = prizes_str;
        replacements.arv = '$'+total;
        
        var config = this.entry_config[0];
        var entryMethod = Bozuko.entry( config.type );
        replacements.entry_requirement = entryMethod.getEntryRequirement();
        
        rules = rules.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, function(match, key){
            return replacements[key] || '';
        });
        return rules;
    }
    return '';
});
/**
 * Create the results array
 *
 * @public
 */
Contest.method('generateResults', function(callback){
    var self = this;

    var prof = new Profiler('/models/contest/generateResults');
    self.getEngine().generateResults(this);
    prof.stop();
    this.save(function(error){
        if( error ) return callback(error);
        return callback(null, self.results);
    });
});

Contest.method('createAndSaveBarcodes', function(prize, cb) {
    var self = this;
    var s3 = new S3();

    var i = 0;
    async.whilst(
        function() { return i < prize.prize.total; },
        function(callback) {
            var filename, path;
            if (prize.is_consolation) {
                filename = '/tmp/bc_'+self._id+'_consolation_prize_'+prize.index+'_'+i;
                path = '/game/'+self._id+'/consolation_prize/'+prize.index+'/barcode/'+i;
            } else {
                filename = '/tmp/bc_'+self._id+'_prize_'+prize.index+'_'+i;
                path = '/game/'+self._id+'/prize/'+prize.index+'/barcode/'+i;
            }
            // save the barcode image in /tmp
            barcode.create_png(prize.prize.barcodes[i], prize.prize.barcode_type, filename, function(err) {
                if (err) return callback(err);
                // load the barcode image into s3
                return s3.put(filename+'.png', path, function(err) {
                    if (err) return callback(err);
                    i++;
                    // remove the barcode files from /tmp
                    return fs.unlink(filename+'.ps', function(err) {
                        if (err) return callback(err);
                        return fs.unlink(filename+'.png', callback);
                    });
                });

            });
        },
        function(err) {
            if (err) {
                console.error("contest.createAndSaveBarcodes: "+err);
                return cb(err);
            }
            return cb(null);
        }
    );

});

Contest.method('generateBarcodes', function(cb) {
    var self = this;
    var i = 0;
    var barcode_prizes = [];
    for (i = 0; i < this.prizes.length; i++) {
        if (this.prizes[i].is_barcode) {
            barcode_prizes.push({
                index: i,
                is_consolation: false,
                prize: this.prizes[i]
            });
        }
    }

    for (i = 0; i < this.consolation_prizes.length; i++) {
        if (this.consolation_prizes[i].is_barcode) {
            barcode_prizes.push({
                index: i,
                is_consolation: true,
                prize: this.consolation_prizes[i]
            });
        }
    }

    async.forEach(barcode_prizes,
        function(prize, callback) {
            return self.createAndSaveBarcodes(prize, callback);
        }, function(err) {
            if (err) return cb(err);
            return cb(null);
        }
    );
});

/**
 * Publish the contest
 *
 * @public
 */
Contest.method('publish', function(callback){
    var self = this;
    // compute the number of entries based on the win frequency
    // first we need to get the total number of prizes
    var total_prizes = 0;
    this.prizes.forEach(function(prize){
        total_prizes += prize.total || 0;
    });

    this.total_entries = total_prizes * this.win_frequency;
    this.active = true;
    this.generateResults( function(error, results){
        if( error ) return callback(error);
        return self.generateBarcodes(function(err) {
            if (err) return callback(err);
            Bozuko.publish('contest/publish', {contest_id: self._id, page_id: self.page_id});
            return callback( null, self);
        });
    });
});

/**
 * Cancel a contest
 *
 * @public
 */
Contest.method('cancel', function(callback){
    var self = this;
    self.end = new Date();
    return self.save(function(error){
        if( error ) return callback( error );
        Bozuko.publish('contest/cancel', {contest_id: self._id, page_id: self.page_id});
        return callback( null, self );
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
    return entry.process( function(err, entry) {
        callback(err, entry);
    });
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

Contest.method('getUserInfo', function(user_id, callback) {

    var min_expiry_date = new Date(new Date().getTime() - Bozuko.config.entry.token_expiration);
    Bozuko.models.Entry.find(
        {contest_id: this._id, user_id: user_id, timestamp: {$gt :min_expiry_date}},
        function(err, entries) {
            if (err) return callback(err);
            var tokens = 0;
            var last_entry = null;
            var earliest_active_entry_time = null;
            var last_entry_time = null;

            var prof = new Profiler('/models/contest/getUserInfo');

            entries.forEach(function(entry) {
                if (!earliest_active_entry_time || (entry.timestamp < earliest_active_entry_time)) {
                    earliest_active_entry_time = entry.timestamp;
                }

                if (!last_entry_time || (entry.timestamp > last_entry_time)) {
                    last_entry_time = entry.timestamp;
                    last_entry = entry;
                }

                tokens += entry.tokens;
            });

            prof.stop();

            return callback(null, {
                tokens: tokens,
                last_entry: last_entry,
                earliest_active_entry_time: earliest_active_entry_time
            });
        }
    );

});

Contest.method('loadGameState', function(user, callback){

    var self = this;

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
        contest: self,
        game_over: false
    };

    this.game_state = state;

    function load() {
        // Contest is over for this user
        if (state.user_tokens === 0 && this.token_cursor == this.total_plays - this.total_free_plays) {
            state.game_over = true;
	    state.next_enter_time = 'Never';
	    state.button_text = 'Game Over';
            state.button_enabled = false;
            return callback(null, state);
        }

        return entryMethod.getButtonText( state.user_tokens, function(error, text){
            if( error ) return callback(error);
            state.button_text= text;
            return entryMethod.getNextEntryTime( function(error, time){
                if( error ) return callback( error );
                state.next_enter_time = time;

                return entryMethod.getButtonEnabled( state.user_tokens, function(error, enabled){
                    if( error ) return callback( error);
                    state.button_enabled = enabled;
                    return callback(null, state);
                });
            });
        });
    }

    if (user) {
        return this.getUserInfo(user._id, function(err, info){
            if (err) return callback(err);
            if (info.tokens) state.user_tokens = info.tokens;
            return load();
        });
    }

    return load();

});

Contest.method('loadEntryMethod', function(user, callback){
    var self =this;

    // we need to create an entry to see whats up...
    var config = this.entry_config[0];
    var entryMethod = Bozuko.entry(config.type, user);
    entryMethod.setContest(this);
    entryMethod.configure(config);

    self.entry_method = entryMethod;
    self.entry_method.load( function(error){
        if( error ) return callback(error);
        return callback(null, entryMethod);
    });

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

Contest.method('addEntry', function(tokens, callback) {

    var prof = new Profiler('/models/contest/addEntry');

    var self = this;
    Bozuko.models.Contest.findAndModify(
        { _id: this._id, token_cursor: {$lte : this.total_plays - this.total_free_plays - tokens}},
        [],
        {$inc : {'token_cursor': tokens}},
        {new: true, fields: {plays: 0, results: 0}},
        function(err, contest) {
            prof.stop();
            if (err) return callback(err);
            if (!contest) {
                return callback(Bozuko.error('entry/not_enough_tokens'));
            }
            return callback(null);
        }
    );
});

Contest.static('audit', function(callback) {
    // find all contests with active plays
    return Bozuko.models.Contest.find({'plays.active' : true}, function(err, contests) {
        if (err) return callback(err);
        if (!contests) return callback(null);
        if (contests.length === 0) return callback(null);

        console.log("AUDIT: "+contests.length+" contests with active plays");

        return async.forEachSeries(contests, function(contest, callback) {

            return async.forEachSeries(contest.plays, function(play, callback) {
                if (!play.active) return callback(null);

                return contest.getResult({
                    user_id: play.user_id,
                    play_cursor: play.cursor,
                    timestamp: play.timestamp,
                    uuid: play.uuid,
                    audit: true
                }, callback);
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

    return Bozuko.models.Entry.findAndModify(
        {contest_id: this._id, user_id: user_id, timestamp: {$gt :min_expiry_date}, tokens: {$gt : 0}},
        [],
        {$inc: {tokens : -1}},
        {new: true},
        function(err, entry) {
            if (err) return callback(err);
            if (!entry) return callback(Bozuko.error("contest/no_tokens"));
            // If we crash here the user will lose a token. Don't worry about it now.

            var prof = new Profiler('/models/contest/startPlay/Contest.findAndModify');
            return Bozuko.models.Contest.findAndModify(
                {_id: self._id},
               [],
                {$inc : {play_cursor: 1},
                    $push : {plays: {timestamp: now, active: false, uuid: _uuid, user_id: user_id}}},
                {new: true, fields: {plays: 0, results: 0}},
                function(err, contest) {
                    prof.stop();
                    if (err) return callback(err);
                    if (!contest) return callback(Bozuko.error("contest/no_tokens"));
                    var opts = {
                        user_id: user_id,
                        play_cursor: contest.play_cursor,
                        timestamp: now,
                        uuid: _uuid
                    };

                    // Need to record the play cursor and set the play to active.
                    // Man, I wish this could be done in one update to contest...
                    return Bozuko.models.Contest.findAndModify(
                        {_id: self._id, 'plays.uuid': _uuid},
                        [],
                        {$set : {'plays.$.active': true, 'plays.$.cursor': contest.play_cursor}},
                        {new: true, fields: {plays: 0, results: 0}},
                        function(err, contest) {
                            if (err) return callback(err);
                            if (!contest) return callback(Bozuko.error("contest/play_not_found"));
                            return contest.getResult(opts, callback);
                        }
                    );
                }
            );
        }
    );
});

Contest.method('getResult', function(opts, callback) {
    var self = this;
    var result_field = 'results.'+opts.play_cursor;
    var filter = {};
    filter[result_field] = 1;

    var prof = new Profiler('/models/contest/getResult');
    return Bozuko.models.Contest.findOne({_id: this._id}, filter, function(err, contest) {
        prof.stop();
        if (err) return callback(err);
        if (!contest) {
            console.error('getResult: couldnt find contest result');
            opts.results = {};
            return self.createPrize(opts, callback);
        }
        opts.results = contest.results;
        return self.createPrize(opts, callback);
    });

});

function letter(val) {
    return val + 65;
}
function get_code(num) {
    var prof = new Profiler('/models/contest/get_code');
    var pow;
    var vals = new Array(5);
    for (var i = 4; i >= 0; i--) {
        pow = Math.pow(26,i);
        vals[i] = Math.floor(num / pow);
        num = num - vals[i]*pow;
    }

    var code = String.fromCharCode(66, letter(vals[4]), letter(vals[3]), letter(vals[2]), letter(vals[1]), letter(vals[0]));
    prof.stop();
    return code;
}

// Only claim a consolation prize if there are some remaining
Contest.method('claimConsolation', function(opts, callback) {
    var total = this.consolation_prizes[0].total;

    var prof = new Profiler('/models/contest/claimConsolation');
    Bozuko.models.Contest.findAndModify(
        { _id: this._id, consolation_prizes: {$elemMatch: {claimed: {$lt : total-1}}}},
        [],
        {$inc : {'consolation_prizes.$.claimed': 1}},
        {new: true, fields: {plays: 0, results:0}},
        function(err, contest) {
            prof.stop();
            if (err) return callback(err);
            if (!contest) {
                opts.consolation = false;
                return callback(null);
            }
            opts.consolation_prize_code = get_code(contest.consolation_prizes[0].claimed);
            opts.consolation_prize_count = contest.consolation_prizes[0].claimed;
            return contest.savePrize(opts, callback);
        }
    );
});

Contest.method('saveConsolation', function(opts, callback) {
    opts.consolation = true;
    var self = this;
    var config = this.consolation_config[0];

    var consolation_prize = self.consolation_prizes[0];
    if (consolation_prize.claimed === (consolation_prize.total-1)) {
        opts.consolation = false;
        return callback(null);
    }

    if (config.who === 'losers' && opts.win === true) return callback(null);

    if (config.who === 'all' && config.when === 'always') return this.claimConsolation(opts, callback);

    // Is there a winner for the current active entries?
    function savePrizeIfLoser() {
        return Bozuko.models.Play.findOne({contest_id: self._id, user_id: opts.user_id, win: true,
            free_play: false, timestamp: {$gt :opts.user_info.earliest_active_entry_time}},
            function(err, play) {
                if (err) return callback(err);

                // We are a real loser, save the prize
                if (!play) return self.claimConsolation(opts, callback);

                // We won recently
                return callback(null);
            }
        );
    }

    if (config.who === 'losers' && config.when === 'always') {
        return savePrizeIfLoser();
    }

    if (config.when === 'once') {
        return Bozuko.models.Prize.findOne(
            {contest_id: this._id, user_id: opts.user_id, consolation: true},
            function(err, prize) {
                if (err) return callback(err);
                if (prize) return callback(null);

                if (config.who === 'losers') {
                    return savePrizeIfLoser(opts, callback);
                }

                if (config.who === 'all') {
                    return self.claimConsolation(opts, callback);
                }
            }
        );
    }
    // TODO: Implement (config.when === 'interval')

    console.log("\n\nNO MAN'S LAND\n\n");
    /**
     * MARK - I think this is being reached even if interval isn't the when...
     * I'm going to log the config so we can see whats going on, but also
     * return the callback so the last play doesn't get wierd.
     */
    return callback(null);
});

Contest.method('savePrize', function(opts, callback) {
    var self = this;
    var prize;

    if( opts.prize_index === false && !opts.consolation) {
        return callback(null, null);
    }

    if (opts.consolation) {
        prize = self.consolation_prizes[0];
    } else {
        prize = self.prizes[opts.prize_index];
    }

    if (!prize) return callback(Bozuko.error('contest/no_prize'));

    var prof = new Profiler('/models/contest/savePrize/find page');
    return Bozuko.models.Page.findById( self.page_id, function(error, page){
        prof.stop();
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
            user_id: opts.user_id,
            uuid: opts.uuid,
            code: opts.consolation ? opts.consolation_prize_code : opts.prize_code,
            value: prize.value,
            page_name: page.name,
            name: prize.name,
            timestamp: opts.timestamp,
            status: 'active',
            instructions: prize.instructions,
            expires: expires,
            play_cursor: opts.play_cursor,
            description: prize.description,
            redeemed: false,
            consolation: opts.consolation,
            is_email: prize.is_email,
            is_barcode: prize.is_barcode
        });

        if (prize.is_email) {
            user_prize.email_body = prize.email_body;
            if (opts.consolation) {
                user_prize.email_code = prize.email_codes[opts.consolation_prize_count];
            } else {
                user_prize.email_code = prize.email_codes[opts.prize_count];
            }
        }
        if (prize.is_barcode) {
            if (opts.consolation) {
                user_prize.barcode_image = burl('/game/'+self._id+'/consolation_prize/0/barcode'+opts.consolation_prize_count);
            } else {
                user_prize.barcode_image = burl('/game/'+self._id+'/prize/'+opts.prize_index+'/barcode/'+opts.prize_count);
            }
        }

        return user_prize.save(function(err) {
            if (err) return callback(err);
            return callback(null, user_prize);
        });
    });
});

Contest.method('createPrize', function(opts, callback) {
    var self = this;
    var result = opts.results[opts.play_cursor];
    opts.win = result ? true : false;

    // Did we win a free_play? If so there isn't a prize.
    if (result === 'free_play') {
        var free_play_index = self.prizes.length;
        opts.game_result = Bozuko.game(this).process(free_play_index );
        opts.prize = null;
        opts.free_play = true;
        return self.savePlay(opts, callback);
    }

    // We didn't get a free play. Did the user win?
    opts.game_result = Bozuko.game( this ).process( result ? result.index : false );
    opts.prize_index = result ? result.index : false;
    opts.prize_code = result ? result.code : false;
    opts.prize_count = result ? result.count : false;
    opts.free_play = false;

    // Should we hand out a consolation prize?
    // Don't worry about this for audit code, as the user's info might have changed.
    if (!opts.audit) {
        return this.getUserInfo(opts.user_id, function(err, info) {
            if (err) return callback(err);
            if (info.tokens === 0 && self.consolation_config.length != 0 && self.consolation_prizes.length != 0) {
                opts.user_info = info;
                return self.saveConsolation(opts, function(err, consolation_prize) {
                    if (err) return callback(err);

                    // The prize we are saving isn't a consolation prize although there may be one of those also.
                    opts.consolation = false;
                    return self.savePrize(opts, function(err, user_prize) {
                        if (err) return callback(err);
                        opts.prize = user_prize;

                        // If there was a consolation prize reset opts to reflect that
                        if (consolation_prize) {
                            opts.consolation = true;
                            opts.consolation_prize = consolation_prize;
                        }
                        return self.savePlay(opts, callback);
                    });
                });
            }

            // Is there a regular (non-consolation) prize?
            opts.consolation = false;
            return self.savePrize(opts, function(err, user_prize) {
                opts.prize = user_prize;
                if (err) return callback(err);
                return self.savePlay(opts, callback);
            });

        });
    }

    // Is there a regular (non-consolation) prize?
    opts.consolation = false;
    return this.savePrize(opts, function(err, user_prize) {
        opts.prize = user_prize;
        if (err) return callback(err);
        return self.savePlay(opts, callback);
    });

});

Contest.method('savePlay', function(opts, callback) {
    var self = this;

    var play = new Bozuko.models.Play({
        contest_id: this._id,
        page_id: this.page_id,
        user_id: opts.user_id,
        uuid: opts.uuid,
        play_cursor:  opts.play_cursor,
        timestamp: opts.timestamp,
        game: this.game,
        win: opts.win,
        free_play: opts.free_play
    });

    if (opts.prize) {
        play.prize_id = opts.prize._id;
        play.prize_name = opts.prize.name;
    }

    if (opts.consolation_prize) {
        play.consolation = true;
        play.consolation_prize_id = opts.consolation_prize._id;
        play.consolation_prize_name = opts.consolation_prize.name;
    } else {
        play.consolation = false;
    }

    opts.play = play;

    return play.save(function(err) {
        Bozuko.publish('contest/play', play.doc );
        if( !play.win ){
            Bozuko.publish('contest/lose', play.doc );
            if( play.consolation ){
                Bozuko.publish('contest/consolation', play.doc );
            }
        }
        else{
            if( play.free_play ){
                Bozuko.publish('contest/free_play', play.doc );
            }
            else{
                Bozuko.publish('contest/win', play.doc );
            }
        }
        if (err) return callback(err);
        return self.endPlay(opts, callback);
    });
});

Contest.method('endPlay', function(opts, callback) {
    var self = this;


    function handler(err, contest) {
        if (err) return callback(err);
        var prize = opts.prize;
        if (opts.consolation && !opts.prize) {
            prize = opts.consolation_prize;
        }
        return callback(null, {
            contest: contest,
            play: opts.play,
            game_result: opts.game_result,
            prize: prize,
            free_play: opts.free_play
        });
    }
    var min_expiry_date = new Date(opts.timestamp.getTime() - Bozuko.config.entry.token_expiration);

    // We don't want to touch the users entry tokens during an audit
    // We just want to recreate the prize and play records.
    if (opts.free_play && !opts.audit) {

        var prof = new Profiler('/models/contest/endPlay/Entry.findAndModify');
        return Bozuko.models.Entry.findAndModify(
            {contest_id: this._id, user_id: opts.user_id, timestamp: {$gt :min_expiry_date}},
            [],
            {$inc: {tokens: 1}},
            {new: true},
            function(err, entry) {
                prof.stop();
                if (err) return callback(err);
                // There isn't an active entry to give a token to. Log it and don't give out a free play.
                if (!entry) {
                    console.error("Free play won for contest "+self._id+" user "+opts.user_id+
                        ". No active entries prevents distribution");
                    opts.free_play = false;
                    opts.win = false;
                }
                var prof2 = new Profiler('/models/contest/endPlay/Contest.findAndModify');
                return Bozuko.models.Contest.findAndModify(
                    {_id: self._id, 'plays.uuid': opts.uuid},
                    [],
                    {$pull: {plays: {uuid: opts.uuid}}},
                    {new: true, fields: {plays: 0, results:0}},
                    function(err, contest) {
                        prof2.stop();
                        handler(err, contest);
                    }
                );
            }
        );
    }

    var prof = new Profiler('/models/contest/endPlay/Contest.findAndModify2');
    return Bozuko.models.Contest.findAndModify(
        {_id: this._id, 'plays.uuid': opts.uuid},
        [],
        {$pull: {plays: {uuid: opts.uuid}}},
        {new: true, fields: {plays: 0, results:0}},
        function(err, contest) {
            prof.stop();
            handler(err, contest);
        }
    );

});

Contest.method('getGame', function(){
    var game = Bozuko.game( this );
    return game;
});

Contest.method('getBestPrize', function(){
    if( this.prizes.length == 0 ) return null;
    var prizes = this.prizes.slice();
    prizes.sort( function(a, b){
        return b.value - a.value;
    });
    return prizes[0];
});

function getGCD(x,y) {
    var w;
    while (y != 0) {
        w = x % y;
        x = y;
        y = w;
    }
    return x;
}
