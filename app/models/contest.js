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
var safe = {w:2, wtimeout:5000};

var Contest = module.exports = new Schema({
    page_id                 :{type:ObjectId, index :true},
    page_ids                :{type:[ObjectId], index: true},
    name                    :{type:String},
    engine_type             :{type:String, default:'order'},
    engine_options          :{},
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
    active                  :{type:Boolean, index: true},
    start                   :{type:Date, index: true},
    end                     :{type:Date, index: true},
    total_entries           :{type:Number},
    total_plays             :{type:Number},
    results                 :{},
    play_cursor             :{type:Number, default: -1},
    token_cursor            :{type:Number, default: 0},
    winners                 :[ObjectId]
}, {safe: {w:2, wtimeout: 5000}});

Contest.ACTIVE = 'active';
Contest.PUBLISHED = 'published';
Contest.COMPLETE = 'complete';
Contest.DRAFT = 'draft';
Contest.CANCELLED = 'cancelled';

Contest.plugin( JsonPlugin );

var no_matching_re = /no\smatching\sobject/i;

Contest.virtual('state')
    .get(function(){
        var now = new Date().getTime();
        if( !this.active ) return Contest.DRAFT;
        if( this.engine_type === 'order' && (this.play_cursor+1 >= this.total_plays) ) {
            return Contest.COMPLETE;
        }
        if( now > this.start.getTime() && now < this.end.getTime() ) {
            return Contest.ACTIVE;
        }
        if( now < this.start.getTime() ) return Contest.PUBLISHED;
        return Contest.COMPLETE;
    });

Contest.method('getEntryConfig', function() {
    return this.entry_config[0];
});

Contest.method('validate_', function(callback) {
    var self = this;

    async.parallel({
        entries_and_plays: function(cb) {
            self.validateEntriesAndPlays(cb);
        },
        prizes: function(cb) {
            self.validatePrizes(false, cb);
        },
        consolation_prizes: function(cb) {
	    self.validatePrizes(true, cb);
        },
        results: function(cb) {
            self.validateResults(cb);
		}
    },
    callback
    );
});

Contest.method('validateEntriesAndPlays', function(callback) {
    var status = { errors: [], warnings: [] };
    if (!this.active) {
	return callback(null, status);
    }
    var entry_config = this.getEntryConfig();
    var tokens_per_entry = entry_config.tokens;
    if (entry_config.type === 'facebook/checkin' && entry_config.options && entry_config.options.enable_like) {
        tokens_per_entry = tokens_per_entry * 2;
    }
    if ((this.total_plays - this.total_free_plays) === this.total_entries*tokens_per_entry) {
        return callback(null, status);
    }
    return callback(null, {errors: [Bozuko.error('validate/contest/plays_entries_tokens')]});
});

Contest.method('validatePrizes', function(isConsolation, callback) {
    var self = this;
    var prize;
    var barcode_prizes = [];
    var status = { errors: [], warnings: [] };

    var prizes = isConsolation ? this.consolation_prizes : this.prizes;

    if (prizes.length === 0 && !isConsolation) {
        status.errors.push(Bozuko.error('validate/contest/no_prizes'));
        return callback(null, status);
    }

    for (var i = 0; i < prizes.length; i++) {
        prize = prizes[i];

        if (prize.is_email) {
            if (prize.total != prize.email_codes.length) {
                status.errors.push(Bozuko.error('validate/contest/email_codes', prize.name));
            }
            if (prize.email_body === "") {
                status.errors.push(Bozuko.error('validate/contest/email_body', prize.name));
            }
        }

        if (prize.is_barcode) {
            if (prize.total != prize.barcodes.length) {
                status.errors.push(Bozuko.error('validate/contest/barcodes_length', prize.name));
            }

	    barcode_prizes.push(i);
        }
    }

    if (!this.active || !barcode_prizes.length) {
	return callback(null, status);
    }

    // Check S3 to see if all barcodes are there
    async.forEach(barcode_prizes, function(index, cb) {
        var prize = self.prizes[index];
        var ct = 0;
        async.forEachSeries(prize.barcodes, function(barcode, cb) {
            var path = '/game/'+self._id+'/prize/'+index+'/barcode/'+ct;
	    ct++;
            S3.head(path, cb);
        }, function(err) {
            if (err) {
		status.errors.push(Bozuko.error('validate/contest/barcodes_s3', prize.name));
	    }
	    cb(null);
        });
    }, function(err) {
	return callback(null, status);
    });

});

Contest.method('validateResults', function(callback) {
    var status = { errors: [], warnings: [] };
    if (!this.active) return callback(null, status);

    var counts = [];
    var free_plays = 0;
    var index;

    for (var i = 0; i < this.total_plays; i++) {
	if (this.results[i]) {
	    if (this.results[i] === 'free_play') {
		free_plays++;
	    } else {
		index = this.results[i].index;
	        if (counts[index] == undefined) {
		    counts[index] = 1;
		} else {
		    counts[index]++;
		}
	    }
	}
    }

    var prize;
    for (var j = 0; j < this.prizes.length; j++) {
	prize = this.prizes[j];
        if (prize.total != counts[j]) {
	    status.errors.push(Bozuko.error('validate/contest/results_prize_count', prize.name));
	}
    }
    if (this.total_free_plays != free_plays) {
	status.errors.push(Bozuko.error('validate/contest/results_free_play_count'));
    }
    return callback(null, status);
});


Contest.method('getOfficialRules', function(){

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
    var total = 0, total_plays = this.getTotalPlays();
    prizes.forEach(function(prize, i){
	var arv_str = i==0 ? 'Approximate Retail Value ("ARV")' : 'ARV';
	prizes_str+= prize.total+' '+map[i]+' Prizes. each, '+prize.name+', '+arv_str+': $'+prize.value+'. ';
	if( prize.details ) prizes_str+= prizes.details+' ';
	var gcd = getGCD( prize.total, self.total_plays );

	prizes_str+= 'Odds of winning are 1 / '+(total_plays/prize.total).toFixed(2)+' per play. ';
	total = prize.value * prize.total;
    });

    consolation_prizes.forEach(function(prize, i){
	var arv_str = i==0 ? 'Approximate Retail Value ("ARV")' : 'ARV';
	prizes_str+= prize.total+' '+map[i]+' Prizes. each, '+prize.name+', '+arv_str+': $'+prize.value+'. ';
	if( prize.details ) prizes_str+= prizes.details+' ';
	var gcd = getGCD( prize.total, self.total_plays );

	prizes_str+= 'Odds of winning are 1 / '+(total_plays/prize.total).toFixed(2)+' per play. ';
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

    if( this.rules ){
	rules += "\n\n----------\n\n"+this.rules;
    }

    return rules;
});

Contest.method('getTotalPrizeCount', function(){
    var count = 0;
    if( me.prizes && me.prizes.length ) me.prizes.forEach(function(prize){
	count += prize.total;
    });
    return count;
});

Contest.method('getTotalEntries', function(){
    if( this.mode == 'odds' ){
	// need to get the total
	return Math.ceil(this.win_frequency * this.contest.getTotalPrizeCount());
    }
    else{
	return this.total_entries;
    }
});

Contest.method('getTotalPlays', function(){
    return this.getTotalEntries() * this.entry_config[0].tokens;
});

/**
 * Create the results array
 *
 * @public
 */
Contest.method('generateResults', function(callback){
    var self = this;

    var prof = new Profiler('/models/contest/generateResults');
    self.getEngine().generateResults(function(err, results) {
        prof.stop();
        if (err) return callback(err);
        self.save(function(error){
            if( error ) return callback(error);
            return callback(null, results);
        });
    });
});

Contest.method('createAndSaveBarcodes', function(prize, cb) {
    var self = this;

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
                // loadpa the barcode image into s3
                return S3.put(filename+'.png', path, function(err) {
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

Contest.method('totalPrizes', function() {
    var total = 0;
    for (var i = 0; i < this.prizes.length; i++) {
        total += this.prizes[i].total;
    }
    return total;
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
        prize.won = 0;
        prize.redeemed = 0;
    });

    if (this.engine_type === 'order') {
        if( !this.engine_options || !this.engine_options.mode || this.engine_options.mode == 'odds'){
            this.total_entries = Math.ceil(total_prizes * this.win_frequency);
        }
    }

    // Remove this entry restriction after beta (when we have pricing)
    Bozuko.models.Page.findOne({_id: self.page_id}, {name: 1}, function(err, page) {
        if (!err && page && page.name != 'Bozuko' && page.name != 'Demo Games' && self.total_entries > 1500) {
            return callback(Bozuko.error('contest/max_entries', 1500));
        }
        self.active = true;
        self.generateResults( function(error, results){
            if( error ) return callback(error);
            return self.generateBarcodes(function(err) {
                if (err) return callback(err);
                Bozuko.publish('contest/publish', {contest_id: self._id, page_id: self.page_id});
                return callback( null, self);
            });
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
 * Note that the entry param is not an entry model, it is an Entry with prototype in
 * core/contest/entry.js
 */
Contest.method('enter', function(entry, callback){
    var self = this;
    var cfg = this.getEntryConfig();
    if( cfg.type != entry.type ){
        return callback( Bozuko.error('contest/invalid_entry_type', {contest:this, entry:entry}) );
    }

    entry.setContest(this);
    entry.configure(cfg);
    return entry.process( function(err, entry) {
        if( !err ) self.schema.emit('entry', entry);
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
    return this.getEntryMethod().getListMessage();
});

Contest.method('getEntryMethodDescription', function(user, callback){
    return this.getEntryMethod(user).getDescription(callback);
});
Contest.method('getEntryMethod', function(user){
    if (this.entry_method) return this.entry_method;
    var config = this.entry_config[0];
    var entryMethod = Bozuko.entry( config.type, user );
    entryMethod.configure( config );
    entryMethod.setContest( this );
    this.entry_method = entryMethod;
    return entryMethod;
});

Contest.method('getEntryMethodHtmlDescription', function(){
    return this.getEntryMethod().getHtmlDescription();
});


Contest.method('loadGameState', function(user, callback){

    var self = this,
    state = {
        user_tokens: 0,
        next_enter_time: new Date(),
        button_text: '',
        button_enabled: true,
        button_action: 'enter',
        contest: self,
        game_over: false
    };

    self.game_state = state;
    return async.series([

        function update_user(cb){
            if( user ){
                return user.updateInternals(function(error){
                    if( error ) return cb(error);

                    return Bozuko.models.Entry.getUserInfo(self._id, user._id, function(err, info){
                        if (err) return callback(err);
                        if (info.tokens) state.user_tokens = info.tokens;
                        return cb();
                    });

                });
            }
            return cb();
        },

        function load_state(cb){
            // Contest is over for this user
            if (self.engine_type === 'order' && state.user_tokens === 0 && this.token_cursor == this.total_plays - this.total_free_plays) {
                state.game_over = true;
                state.next_enter_time = 'Never';
                state.button_text = 'Game Over';
                state.button_enabled = false;
                return cb();
            }

            return self.getEntryMethod(user).getButtonState(state.user_tokens,  function(err, buttonState) {
                state.button_text = buttonState.text;
                state.next_enter_time = buttonState.next_enter_time;
                state.button_enabled = buttonState.enabled;
                return cb();
            });
        }
    ], function return_state(error){
        return callback(error, state);
    });

});

Contest.method('loadTransferObject', function(user, callback){
    var self = this;
    return self.loadGameState(user, function(error){
        if( error ) return callback(error);
        return callback( null, self);
    });
});

Contest.method('ensureTokens', function(entry) {
    return this.getEngine().allowEntry(entry);
});

Contest.method('addEntry', function(tokens, callback) {
    return this.getEngine().enter(tokens, callback);
});

Contest.method('play', function(memo, callback){
    var self = this;

    // the user was passed in (normal case)
    if (!memo.timestamp) {
        memo = {
            contest: this,
            user: memo,
            timestamp: new Date()
        };
    }

    var engine = this.getEngine();
    async.reduce(
        ['spendEntryToken', engine.play, 'processResult',
         'savePrizes', 'savePlay'],
        memo,
        function(memo, fn, cb) {
            if (typeof fn === 'string') return self[fn](memo, cb);
            return engine.play(memo, cb);
        }, function(error, result) {
            if( !error ){
                // ensure that everything is matched up here....
                self.schema.emit('play', self, result);
            }
            return callback(error, result);
        }
    );
});

Contest.method('spendEntryToken', function(memo, callback) {
    var self = this;
    min_expiry_date = new Date(memo.timestamp.getTime() - Bozuko.config.entry.token_expiration);
    Bozuko.models.Entry.findAndModify(
        {contest_id: self._id, user_id: memo.user._id, timestamp: {$gt: min_expiry_date}, tokens: {$gt : 0}},
        [],
        {$inc: {tokens : -1}},
        {new: true, safe: safe},
        function(err, entry) {
            // If we crash here the user will lose a token. Don't worry about it.
            if (err && !err.errmsg.match(no_matching_re)) return callback(err);
            if (!entry) {
                return callback(Bozuko.error("contest/no_tokens"));
            }
            memo.entry = entry;
            return callback(null, memo);
        }
    );
});

Contest.method('processResult', function(memo, callback) {
    var result = memo.result;
    memo.win = result ? true : false;

    // Did we win a free_play? If so there isn't a prize.
    if (result === 'free_play') {
        var free_play_index = this.prizes.length;
        memo.game_result = Bozuko.game(this).process(free_play_index );
        memo.free_play = true;
        memo.prize_index = false;
        return this.incrementEntryToken(memo, callback);
    }

    // We didn't get a free play. Did the user win?
    memo.game_result = Bozuko.game( this ).process( result ? result.index : false );
    memo.prize_index = result ? result.index : false;
    memo.prize_code = result ? result.code : false;
    memo.prize_count = result ? result.count : false;
    memo.free_play = false;
    return callback(null, memo);

});

Contest.method('savePrizes', function(memo, callback) {
    var self = this;

    return Bozuko.models.Entry.getUserInfo(this._id, memo.user._id, function(err, info) {
        if (err) return callback(err);

        // Should we hand out a consolation prize?
        if (info.tokens === 0 && self.consolation_config.length != 0 && self.consolation_prizes.length != 0) {
            memo.user_info = info;
            return self.saveConsolation(memo, function(err, consolation_prize) {
                if (err) return callback(err);

                // The prize we are saving isn't a consolation prize although there may be one of those also.
                memo.consolation = false;
                return self.savePrize(memo, function(err, user_prize) {
                    if (err) return callback(err);
                    memo.prize = user_prize;

                    // If there was a consolation prize reset memo to reflect that
                    if (consolation_prize) {
                        memo.consolation = true;
                        memo.consolation_prize = consolation_prize;
                        if (!memo.prize) memo.prize = memo.consolation_prize;
                    }
                    return callback(null, memo);
                });
            });
        }

        // Is there a regular (non-consolation) prize?
        memo.consolation = false;
        return self.savePrize(memo, function(err, user_prize) {
            if (err) return callback(err);
            memo.prize = user_prize;
            return callback(null, memo);
        });
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
        {new: true, fields: {plays: 0, results:0}, safe: safe},
        function(err, contest) {
            prof.stop();
            if( err && !err.errmsg.match(no_matching_re) ) console.error(err);
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
        return Bozuko.models.Play.findOne({contest_id: self._id, user_id: opts.user._id, win: true,
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
            {contest_id: this._id, user_id: opts.user._id, consolation: true},
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
            user_id: opts.user._id,
            user_name: opts.user._name,
            prize_id: prize._id,
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
            user_prize.email_format = prize.email_format;
            user_prize.email_subject = prize.email_subject;
            user_prize.email_body = prize.email_body;
            if (opts.consolation) {
                user_prize.email_code = prize.email_codes[opts.consolation_prize_count];
            } else {
                user_prize.email_code = prize.email_codes[opts.prize_count];
            }
        }
        if (prize.is_barcode) {
            if (opts.consolation) {
                user_prize.barcode_image = '/game/'+self._id+'/consolation_prize/0/barcode'+opts.consolation_prize_count;
            } else {
                user_prize.barcode_image = '/game/'+self._id+'/prize/'+opts.prize_index+'/barcode/'+opts.prize_count;
            }
        }

        // this 'if' is for backwards compatability
        if( prize.won || prize.won === 0) Bozuko.models.Contest.collection.update(
            {'prizes._id':prize._id},
            {$inc: {'prizes.$.won':1}},
	    {safe: {w:2, wtimeout: 5000}},
            function(error){
                if( error ) console.error( error );
            }
        );

        return user_prize.save(function(err) {
            if (err) return callback(err);
            return callback(null, user_prize);
        });
    });
});


Contest.method('savePlay', function(memo, callback) {
    var self = this;

    var play = new Bozuko.models.Play({
        contest_id: this._id,
        page_id: this.page_id,
        user_id: memo.user._id,
        play_cursor:  memo.play_cursor,
        timestamp: memo.timestamp,
        game: this.game,
        win: memo.win,
        free_play: memo.free_play
    });

    if (memo.prize) {
        play.prize_id = memo.prize._id;
        play.prize_name = memo.prize.name;
    }

    if (memo.consolation_prize) {
        play.consolation = true;
        play.consolation_prize_id = memo.consolation_prize._id;
        play.consolation_prize_name = memo.consolation_prize.name;
    } else {
        play.consolation = false;
    }

    memo.play = play;

    return play.save(function(err) {
        Bozuko.publish('contest/play', play._doc );
        if( !play.win ){
            Bozuko.publish('contest/lose', play._doc );
            if( play.consolation ){
                Bozuko.publish('contest/consolation', play._doc );
            }
        }
        else{
            if( play.free_play ){
                Bozuko.publish('contest/free_play', play._doc );
            }
            else{
                Bozuko.publish('contest/win', play._doc );
            }
        }
        if (err) return callback(err);
        return callback(null, memo);
    });
});

Contest.method('incrementEntryToken', function(memo, callback) {
        var self = this;
        var prof = new Profiler('/models/contest/winEntryToken');
        return Bozuko.models.Entry.findAndModify(
            {contest_id: this._id, user_id: memo.user._id, timestamp: {$gt :min_expiry_date}},
            [],
            {$inc: {tokens: 1}},
            {new: true, safe: safe},
            function(err, entry) {
                prof.stop();
                if (err && !err.errmsg.match(/no\smatching\sobject/i)) return callback(err);
                if (!entry) {
                    // There isn't an active entry to give a token to. Log it and don't give out a free play.
                    console.error("Free play won for contest "+self._id+" user "+memo.user._id+
                        ". No active entries prevents distribution");
                    memo.free_play = false;
                    memo.win = false;
                }
                return callback(null, memo);
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
