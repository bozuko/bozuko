/*
 * CSV format
 *
 * type, timestamp, user_id, page id, entry type, win, prize name, free play
 *
 */
var Stream = require('stream').Stream,
    util = require('util')
;

exports.stream = function(contest, res) {
    res.header('content-type','text/csv');
    res.header('content-disposition', 'attachment; filename=report.csv');

    var playFormatter = new CsvFormatter(formatPlay, contest);
    var query = Bozuko.models.Play.find({contest_id: contest._id});
    query.stream().pipe(playFormatter);
    playFormatter.pipe(res, {end: false});
    playFormatter.on('end', function() {
        var formatter = new CsvFormatter(formatEntry, contest);
        var query = Bozuko.models.Entry.find({contest_id: contest._id});
        query.stream().pipe(formatter);
        formatter.pipe(res, {end: false});
        formatter.on('end', function() {
            res.end('\n');
        });
    });
};

function formatPlay(doc) {
    return 'play,'+doc.timestamp.toISOString()+","+doc.user_id+","+doc.page_id+",,"+(doc.win || '')+ 
        ","+(doc.prize_name || '')+","+(doc.prize_value || 0)+","+(doc.free_play || '');
}

function formatEntry(doc) {
    return 'entry,'+doc.timestamp.toISOString()+","+doc.user_id+","+doc.page_id+","+
        doc.type+",,,,";
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
    for (var i = 0; i < this.contest.prizes.length; i++) {
       if (doc.prize_name == this.contest.prizes[i].name) {
           doc.prize_value = this.contest.prizes[i].value;
           break;
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
