var Stream = require('stream').Stream,
    util = require('util'),
    async = require('async')
;

exports.stream = function(contest, res) {
    res.header('content-type','text/csv');
    res.header('content-disposition', 'attachment; filename=report.csv');
        
    return write_summary(res, contest, function(err) {
        if (err) {
            res.statusCode = 500;
            return res.end();
        }
        res.write('Details\n\n');
        return write_details(res, contest);
    });
};

function write_summary(res, contest, callback) {
   var hr = 1000*60*60;
   var start_hr = new Date(contest.start.getFullYear(), contest.start.getMonth(),
       contest.start.getDate(), contest.start.getHours());
   var end = new Date();
   if (end > contest.end) end = contest.end;
   var end_hr = new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours());
   var current_hr = start_hr;
   var next_hr = new Date(current_hr.getTime() + hr);

   // write out the summary labels
   res.write('Hourly Summary (EST), Entries, Plays, Prizes Won, Prizes Redeemed\n');
   
   async.whilst(function() {
       return current_hr <= end_hr;
   }, function(cb) {
       return play_and_entry_counts(contest._id, current_hr, next_hr, function(err, rv) {
           if (err) return cb(err);
           return prizes_won_and_redeemed(contest._id, current_hr, next_hr, function(err, rv2) {
               res.write(format_date(current_hr) + ","+rv.entries+","+rv.plays+
                   ","+rv2.won + "," + rv2.redeemed + "\n");
               current_hr = next_hr;
               next_hr = new Date(next_hr.getTime()+hr);
               cb();
           });
       });
   }, function(err) {
       if (err) return callback(err);
       res.write('\n\n\n');
       return callback();
   });
}

/*
 * We don't store page_name in play records, but we do in entry records.
 * When we see a new page in an entry map its name to it's id so we can use the 
 * map when writing out plays.
 */
var page_map = {};

function write_details(res, contest) {
    res.write('Entries\n');
    res.write('Timestamp (UTC), User Id, Place\n');
    var formatter = new CsvFormatter(formatEntry, contest);
    var query = Bozuko.models.Entry.find({contest_id: contest._id});
    query.stream().pipe(formatter);
    formatter.pipe(res, {end: false});
    formatter.on('end', function() {
        res.write('\n\nPlays\n');
        res.write('Timestamp (UTC), User Id, Place, Prize, Value\n');
        var playFormatter = new CsvFormatter(formatPlay, contest);
        var query = Bozuko.models.Play.find({contest_id: contest._id});
        query.stream().pipe(playFormatter);
        playFormatter.pipe(res, {end: false});
        playFormatter.on('end', function() {
            res.write('\n\nPrizes\n');
            res.write('Timestamp (UTC), User Id, Place, Activity, Value\n');
            var prizeFormatter = new CsvFormatter(formatPrize, contest);
            var query = Bozuko.models.Prize.find({contest_id: contest._id});
            query.stream().pipe(prizeFormatter);
            prizeFormatter.pipe(res, {end: false});
            prizeFormatter.on('end', function() {
                res.end('\n');
            });
        });
    });
}

function formatEntry(doc) {
    page_map[String(doc.page_id)] = doc.page_name;
    return doc.timestamp.toISOString()+","+doc.user_id+","+doc.page_name+",,";
}

function formatPlay(doc) {
    var page_name = page_map[String(doc.page_id)];
    return doc.timestamp.toISOString()+","+doc.user_id+","+page_name+","+
        (doc.prize_name || (doc.free_play ? 'free play' : 'LOSS'))+","+(doc.prize_value || 0);
}

function formatPrize(doc) {
    var str = doc.timestamp.toISOString()+","+doc.user_id+","+doc.page_name+","+
        "WON,NA";
    if (doc.redeemed) {
        str += '\n'+doc.redeemed_time.toISOString()+","+doc.user_id+","+doc.page_name+","+
            "REDEEMED,"+doc.value;
    }
    return str;
}

function CsvFormatter(format, contest) {
    Stream.call(this);
    this.writable = true;
    this.format = format;
    this.contest = contest;
}

util.inherits(CsvFormatter, Stream);

CsvFormatter.prototype.write = function(doc) {
    var str = '';
    if (this.format === formatPlay) {
        for (var i = 0; i < this.contest.prizes.length; i++) {
            if (doc.prize_name == this.contest.prizes[i].name) {
                doc.prize_value = this.contest.prizes[i].value;
                break;
            }
        }
    }
    str += this.format(doc) + '\n';
    this.emit('data', str);
    return true;
};

CsvFormatter.prototype.end = 
CsvFormatter.prototype.destroy = function() {
    if (this._done) return;
    this._done = true;   
    this.emit('end');
};

function play_and_entry_counts(contest_id, current_hr, next_hr, callback) {
    var rv = {};
    async.forEach(['Entry', 'Play'], function(type, cb) {
        Bozuko.models[type].count({contest_id: contest_id, $and: [
            {timestamp: {$gte: current_hr}}, {timestamp: {$lt: next_hr}}
        ]}, function(err, count) {
            if (err) return cb(err);
            if (type === 'Entry') rv.entries = count;
            if (type === 'Play') rv.plays = count;
            return cb();
        });
    }, function(err) {
        if (err) return callback(err);
        return callback(null, rv);
    });
}

function prizes_won_and_redeemed(contest_id, current_hr, next_hr, callback) {
    var rv = {};
    return Bozuko.models.Prize.count({contest_id: contest_id, $and: [
        {timestamp: {$gte: current_hr}}, {timestamp: {$lt: next_hr}}
    ]}, function(err, count) {
        if (err) return callback(err);
        rv.won = count;
        return Bozuko.models.Prize.count({contest_id: contest_id, $and: [
            {redeemed_time: {$gte: current_hr}}, {redeemed_time: {$lt: next_hr}}
        ]}, function(err, count) {
            if (err) return callback(err);
            rv.redeemed = count;
            return callback(null, rv);
        });
    });
}

function format_date(date) {
    var str = String(date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear();

    var hr = date.getHours();
    var time = null;
    if (hr === 0) {
        time = '12:00 AM';
    } else if (hr < 12) {
        time = String(hr) + ':00 AM';
    } else if (hr === 12) {
        time = '12:00 PM';
    } else {
        time = String(hr - 12) + ':00 PM';
    };
    return str+' '+time;
}

