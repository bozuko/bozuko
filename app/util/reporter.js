var Stream = require('stream').Stream,
    util = require('util')
;

exports.stream = function(user, contest, res) {
    res.header('content-type','text/csv');

    var formatter = new CsvFormatter();
    var query = Bozuko.models.Play.find({contest_id: contest._id});
    query.stream().pipe(formatter);
    formatter.pipe(res);

};

function CsvFormatter() {
    Stream.call(this);
    this.writable = true;
}

util.inherits(CsvFormatter, Stream);

CsvFormatter.prototype.write = function(doc) {
    var str = '';
    if (!this.started) {
        this.started = true
    } else {
        str += ',\n';
    }
    str += 'play,' + doc.timestamp.toUTCString() + "," + doc.win + "," +
        doc.prize_name + "," + doc.free_play;
    this.emit('data', str);
    return true;
};

CsvFormatter.prototype.end =
CsvFormatter.prototype.destroy = function() {
     this.emit('data', '\n');
     this.emit('end');
};

