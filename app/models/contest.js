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
    inspect = require('util').inspect,
    mail = Bozuko.require('util/mail'),
    jade = require('jade'),
    NextContest = require('./embedded/contest/next_contest')
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
    winners                 :[ObjectId],
    end_alert_sent          :{type:Boolean},
    next_contest            :[NextContest],
    parent                  :{type:ObjectId, index: {sparse: true}}
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
        total += (prize.value * prize.total);
    });

    consolation_prizes.forEach(function(prize, i){
        var arv_str = i==0 ? 'Approximate Retail Value ("ARV")' : 'ARV';
        prizes_str+= prize.total+' '+map[i]+' Prizes. each, '+prize.name+', '+arv_str+': $'+prize.value+'. ';
        if( prize.details ) prizes_str+= prizes.details+' ';
        var gcd = getGCD( prize.total, self.total_plays );

        prizes_str+= 'Odds of winning are 1 / '+(total_plays/prize.total).toFixed(2)+' per play. ';
        total += (prize.value * prize.total);
    });

    replacements.prizes = prizes_str;
    replacements.arv = '$'+total;

    var config = this.getEntryConfig();
    var entryMethod = Bozuko.entry( {contest: this, type: config.type} );
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
    return this.getTotalEntries() * this.getEntryConfig().tokens;
});

/**
 * Create the results array
 *
 * @public
 */
Contest.method('generateResults', function(callback){
    var self = this;

    var prof = new Profiler('/models/contest/generateResults');
    self.getEngine().generateResults(Bozuko.models.Page, self.page_id, function(err) {
        prof.stop();
        if (err) return callback(Bozuko.error('contest/generateResults'));
        return callback(null);
    });
});

Contest.method('getEngine', function() {
    if( !this._engine ){
        var type = String(this.engine_type);
        if( type == '') type = 'order';
        var Engine = Bozuko.require('core/engine/'+type);
        this._engine = new Engine( this );
    }
    return this._engine;
});


Contest.method('saveTimeResult', function(result, callback) {
    result = new Bozuko.models.Result(result);
    result.save(callback);
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
        self.generateResults(function(error){
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

Contest.method('allowEntry', function(opts, callback) {
    // need to check for other entries within the  window
    var selector = {
        contest_id: opts.contest_id,
        user_id: opts.user_id,
        timestamp: {$gt : opts.entry_window}
    };

    return Bozuko.models.Entry.find(selector, function(error, entries){
        if( error ) return callback( error );
        return callback( null, entries.length ? false: true);
    });
});


Contest.method('incrementTokenCursor', function(tokens, callback) {

    var prof = new Profiler('/models/contest/enter');
    Bozuko.models.Contest.findAndModify(
        { _id: this._id, token_cursor: {$lte : this.total_plays - this.total_free_plays - tokens}},
        [],
        {$inc : {'token_cursor': tokens}},
        {new: true, fields: {plays: 0, results: 0}, safe: safe},
        function(err, contest) {
            prof.stop();
            if (err && !err.errmsg.match(no_matching_re)) return callback(err);
            if (!contest) {
                return callback(Bozuko.error('entry/not_enough_tokens'));
            }
            // If the contest just ran out of tokens we will attempt to start the next one
            if (contest.token_cursor == (contest.total_plays - contest.total_free_plays)) {
                return contest.activateNextContest('entries', callback);
            }
            return callback(null);
        }
    );
});

Contest.method('getListMessage', function(){
    return this.getEntryMethod().getListMessage();
});

Contest.method('getEntryMethodDescription', function(user, page_id, callback){
    var self = this;
    Bozuko.models.Page.findById(page_id, function(err, page) {
        if (err) return callback(err);
        if (!page) return callback(Bozuko.error('page/does_not_exist'));
        return self.getEntryMethod(user, page).getDescription(callback);
    });
});

Contest.method('getEntryMethod', function(user, page){
    var config = this.getEntryConfig();
    var options = {
        type: config.type,
        contest: this,
        user: user,
        page: page
    };

    var entryMethod = Bozuko.entry(options);
    entryMethod.configure( config );
    this.entry_method = entryMethod;
    return entryMethod;
});

Contest.method('getEntryMethodHtmlDescription', function(){
    return this.getEntryMethod().getHtmlDescription();
});

Contest.method('sendEndOfGameAlert', function(page) {
    var self = this;

    // build the body of the email...
    return Bozuko.models.User.find({_id: {$in: page.admins}}, {email:1,name:1}, function(err, users) {
        var to = '';
        return users.forEach(function(user) {
            return mail.sendView('contest/expiration', {contest: self, user:user}, {
            to: user.email,
            bcc: 'dev@bozuko.com',
            subject: 'Your Bozuko Contest \''+self.name+'\' is about to expire!',
            body: 'Your Bozuko Contest \''+self.name+'\' is about to expire!\n'
                + 'Please login to your Bozuko account at https://bozuko.com/beta to create a new contest.'
            }, function(err, success, record) {
                if (err || !success) {
                    console.error('Error sending end of game alert for contest_id '+self._id+': '+err);
                } else {
                    // Ensure this alert only goes out once
                    self.end_alert_sent = true;
                    return Bozuko.models.Contest.update(
                        {_id: self._id},
                        {$set: {end_alert_sent: true}},
                        function(err) {
                            if (err) console.error('Error setting end_alert_sent to true for contest_id '+self._id);
                        }
                    );
                }
            });
        });
    });
});

function copyAndPublishContest(reason, contest, callback) {
    var jsonContest = contest.toJSON();
    var contest_duration = contest.end.getTime() - contest.start.getTime();
    delete jsonContest._id;
    jsonContest.prizes.forEach(function(prize) {
        delete prize._id;
    });
    jsonContest.consolation_prizes.forEach(function(prize) {
        delete prize._id;
    });
    jsonContest.name += ' (Copy)';
    jsonContest.plays = [];
    jsonContest.results = {};
    jsonContest.play_cursor = -1;
    jsonContest.token_cursor = 0;
    jsonContest.winners = [];
    jsonContest.next_contest[0].active = false;
    jsonContest.end_alert_sent = false;
    if (reason === 'entries') {
        jsonContest.start = new Date();
    } else {
        jsonContest.start = contest.end;
    }
    jsonContest.end = new Date(jsonContest.start.getTime() + contest_duration);
    jsonContest.parent = contest._id;
    var newContest = new Bozuko.models.Contest(jsonContest);
    newContest.nextContest().contest_id = newContest._id;
    return newContest.save(function(err) {
        if (err) return callback(err);
        return newContest.publish(function(err) {
            return callback(err);
        });
    });
}

function activateContest(reason, contest, callback) {
    var duration = contest.end.getTime() - contest.start.getTime();
    var start;
    if (reason === 'entries') {
        start = new Date();
    } else {
        start = contest.end;
    }
    var end = new Date(start.getTime() + duration);

    Bozuko.models.Contest.update(
        {_id: contest.nextContest().contest_id},
        {$set: {active: true, start: start, end: end, parent: contest._id}},
        callback
    );
}

Contest.method('nextContest', function() {
    return this.next_contest[0];
});

Contest.method('adjustNextContest', function(callback) {
    var start = new Date();
    return Bozuko.models.Contest.update(
        {parent: this._id},
        {$set: {start: start}},
        callback
    );
});

Contest.method('activateNextContest', function(reason, callback) {
    var self = this;
    var next_contest = this.nextContest();

    // Only activate the next contests of active contests
    if (!this.active) return callback();

    // If the next contest is active because it was about to expire in the next day,
    // but the entries just ran out, we want to bump up the start time of the next contest.
    if (reason === 'entries' && next_contest && next_contest.active) return this.adjustNextContest(callback);

    // If there isn't a next contest or it's already active and wasn't handled by the 'if' above then just return
    if (!next_contest || !next_contest.contest_id || next_contest.active) return callback();

    return Bozuko.models.Contest.findAndModify(
        {_id: this._id, 'next_contest.0.active': false},
        [],
        {$set: {'next_contest.0.active': true}},
        {new: true, fields: {plays: 0, results: 0}, safe: safe},
        function(err, contest) {
            if (err) return callback(err);
            if (!contest) return callback();
            if (String(next_contest.contest_id) == self.id) {
                return copyAndPublishContest(reason, contest, callback);
            } else {
                return activateContest(reason, contest, callback);
            }
        }
    );
});

/*
 * This function is run once per hour to find contests that are about to expire.
 * If those contests have a next_contest.contest_id and next_contest.active = false
 * then the next contest is created with a start time that equals the end time of the
 * contest about to expire.
 */
Contest.static('autoRenew', function(callback) {
    var end_time = new Date(Date.now() + 1000*60*60*24); // 24 hrs
    return Bozuko.models.Contest.find(
        {active: true, 'next_contest.0.contest_id': {$exists: true}, 'next_contest.0.active': false,
        $and: [{end: {$gt: new Date()}}, {end: {$lt: end_time}}]},
        function(err, contests) {
            return async.forEach(contests, function(contest, cb) {
                return contest.activateNextContest('time', cb);
            }, function(err) {
                return callback(err);
            });
        }
    );
});

/*
 * page_id param is optional
 *
 * @public
 */
Contest.method('loadGameState', function(opts, callback){
    // use a passed in page_id so we can have multipage contests. default to contest.page_id.
    var page_id = opts.page ? opts.page._id : opts.page_id || this.page_id;
    var page = opts.page;
    var user = opts.user;
    var end_notice_thresh = 0.9;

    var self = this,
    state = {
        user_tokens: 0,
        next_enter_time: new Date(),
        button_text: '',
        button_enabled: true,
        button_action: 'enter',
        contest: self,
        game_over: false,
        page_id: page_id
    };
    self.game_state = state;
    var last_entry = null;
    return async.series([

        function end_alert_check(cb) {
            if (self.end_alert_sent) return cb();
            if ( (self.engine_type === 'order' && self.play_cursor > self.total_plays*end_notice_thresh) ||
            (Date.now() > ( self.start.getTime()+(self.end.getTime() - self.start.getTime())*end_notice_thresh))) {
                // don't wait for the email to get sent
                if (opts.page) {
                    self.sendEndOfGameAlert(page);
                }
                return cb();
            }
            return cb();
        },

        function update_user(cb){
            if( user ){
                return user.updateInternals(function(error){
                    if( error ) return cb(error);

                    return Bozuko.models.Entry.getUserInfo(self._id, user._id, function(err, info){
                        if (err) return callback(err);
                        if (info.tokens) state.user_tokens = info.tokens;
                        last_entry = info.last_entry;
                        return cb();
                    });

                });
            }
            return cb();
        },

        function load_state(cb){
            // Contest is over for this user
            if (self.engine_type === 'order' && state.user_tokens === 0 && self.token_cursor == self.total_plays - self.total_free_plays) {
                state.game_over = true;
                state.next_enter_time = 'Never';
                state.button_text = 'Game Over';
                state.button_enabled = false;
                return cb();
            }

            if (!page && page_id) {
                return Bozuko.models.Page.findById(page_id, function(err, page) {
                    if (err) return callback(err);
                    if (!page) return callback(Bozuko.error('page/does_not_exist'));
                    return self.getEntryMethod(user, page).getButtonState(last_entry, state.user_tokens,
                        function(err, buttonState) {
                            if (err) return callback(err);
                            state.button_text = buttonState.text;
                            state.next_enter_time = buttonState.next_enter_time;
                            state.button_enabled = buttonState.enabled;
                            return cb();
                        }
                    );
                });
            }
            return self.getEntryMethod(user, page).getButtonState(last_entry, state.user_tokens,
                function(err, buttonState) {
                    if (err) return callback(err);
                    state.button_text = buttonState.text;
                    state.next_enter_time = buttonState.next_enter_time;
                    state.button_enabled = buttonState.enabled;
                    return cb();
                }
            );
        }
    ], function return_state(error){
        return callback(error, state);
    });

});

Contest.method('play', function(memo, callback){
    var self = this;
    memo.contest = this;

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

Contest.method('noLookbackQuery', function(memo) {
    return {
        contest_id: this._id,
        timestamp: {$lte: memo.timestamp},
        win_time: {$exists: false}
    };
});

Contest.method('lookbackQuery', function(memo) {
    return {
        contest_id: this._id,
        $and: [{timestamp: {$gt: memo.max_lookback}}, {timestamp: {$lte: memo.timestamp}}],
        win_time: {$exists: false}
    };
});

Contest.method('getTimeResult', function(memo, callback) {
    var self = this;
    return Bozuko.models.Result.findAndModify(
        memo.query,
        [['timestamp', 'asc']],
        {$set: {win_time: memo.timestamp, user_id: memo.user._id, entry_id: memo.entry._id}},
        {new: true, safe: safe},
        function(err, result) {
            if (err) return callback(err);
            memo.result = result;
            if (memo.result) return callback(null, memo);
            memo.new_time = self.getEngine().redistribute(memo.timestamp);
            if (memo.new_time) {
                return self.redistributeTimeResult(memo, callback);
            }
            return callback(null, memo);
        }
    );
});

Contest.method('getOrderResult', function(memo, callback) {
    var query = {_id: memo.contest._id};
    query['results.'+memo.play_cursor] = {$exists: true};

    var opts = {};
    opts['results.'+memo.play_cursor] = 1;

    return Bozuko.models.Contest.findOne(query, opts, function(err, doc) {
        if (err) return callback(err);
        if (doc) {
            memo.result = doc.results[memo.play_cursor];
        }
        return callback(null, memo);
    });
});

Contest.method('incrementPlayCursor', function(memo, callback) {
    var prof = new Profiler('/engines/order/incrementPlayCursor');
    return Bozuko.models.Contest.findAndModify(
        {_id: this._id},
        [],
        {$inc : {play_cursor: 1}},
        {new: true, fields: {plays: 0, results: 0}, safe: safe},
        function(err, contest) {
            prof.stop();
            if (err && !err.errmsg.match(no_matching_re)) return callback(err);
            if (!contest) return callback(Bozuko.error("contest/no_tokens"));
            memo.play_cursor = contest.play_cursor;
            memo.contest = contest;
            return callback(null, memo);
        }
    );

});

Contest.method('redistributeTimeResult', function(memo, callback) {
    var self = this;
    return Bozuko.models.Result.findAndModify(
        {contest_id: this._id, win_time: {$exists: false}, timestamp: {$lt: memo.max_lookback}},
        [['timestamp', 'asc']],
        {$push: {history: {timestamp: memo.new_time, move_time: memo.timestamp}}, $set: {timestamp: memo.new_time}},
        {new: false, safe: safe},
            function(err, result) {
            if (err) return callback(err);
            if (result) {
                console.log("contest: "+self._id+" timestamp redistributed from "+
                    result.timestamp+" to "+memo.new_time+" at "+memo.timestamp);
            }
            return callback(null, memo);
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
    return Bozuko.models.Contest.findAndModify(
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

    var page_id = opts.page_id || this.page_id;

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
    return Bozuko.models.Page.findById( page_id, function(error, page){
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
            page_id: page_id,
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
            is_barcode: prize.is_barcode,
            bucks: prize.bucks
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
            if (!user_prize.bucks) return callback(null, user_prize);

            var value = {bucks: user_prize.bucks};
            var modifier = {};

            // the following 'if' is for backwards compatibility
            if (opts.user.bucks) {
                modifier['$inc'] = value;
            } else {
                modifier['$set'] = value;
            }

            // Add the Bozuko Bucks to the user's account
            return Bozuko.models.User.update(
                {_id: user_prize.user_id},
                modifier,
                function(err) {
                    if (err) {
                        console.error('Failed to update user\'s bucks for prize: '
                            + user_prize._id + ". "+err);
                        return callback(Bozuko.error('user/bucks'));
                    }
                    return callback(null, user_prize);
                }
            );
        });
    });
});


Contest.method('savePlay', function(memo, callback) {
    var self = this;
    var page_id = memo.page_id || this.page_id;

    var play = new Bozuko.models.Play({
        contest_id: this._id,
        page_id: page_id,
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
