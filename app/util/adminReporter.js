var Stream = require('stream').Stream,
    async = require('async'); 

exports.stream = function(contest, res) {
    res.header('content-type', 'text/csv');
    res.header('content-disposition', 'attachment; filename=adminReport.csv');

    async.series([
      function(cb) {
          streamWinners(contest, res, cb);
      },
      function(cb) {
          streamPlayers(contest, res, cb);
      },
      function(cb) {
          streamEntries(contest, res, cb);
      }
    ], function(err) {
        if (err) {
            var str = 'Error streaming admin report for contest '+contest.id+'. '+err;
            res.end(str+'\n');
            console.error(str);
        } else {
            console.log('Done streaming admin report for contest '+contest.name);
            res.end('\n');
        }
    });
};

function streamWinners(contest, res, callback) {
    res.write('WINNERS\n');
    res.write('Name, Prize, Facebook Id, Email\n');
    var stream = Bozuko.models.Prize.find({contest_id: contest._id}).stream();
    stream.on('data', function(doc) {
        var self = this;
        this.pause();
        getWinner(doc, function(err, winner) {
            if (err) return callback(err);
            res.write(winner);
            self.resume();
        });
    });
    stream.on('error', callback); 
    stream.on('close', callback);
}

function streamPlayers(contest, res, callback) {
    res.write('\nPLAYERS\n');
    res.write('Name, Email\n');
    Bozuko.models.Entry.distinct('user_id', {contest_id: contest._id}, function(err, user_ids) {
        if (err) return callback(err);
        async.forEach(user_ids, function(user_id, cb) {
            Bozuko.models.User.findOne({_id: user_id}, {name: 1, email: 1}, function(err, user) {
                if (err) return cb(err);
                res.write(user.name+','+user.email+'\n');
                cb();
            });
        }, callback);
    });
}

function streamEntries(contest, res, callback) {
    res.write('\nENTRIES\n');
    res.write('Name, Timestamp, Facebook Id, Email\n');
    var stream = Bozuko.models.Entry.find({contest_id: contest._id}).stream();
    stream.on('data', function(doc) {
        var self = this;
        this.pause();
        getEntry(doc, function(err, entry) {
            if (err) return callback(err);
            res.write(entry);
            self.resume();
        });
    });
    stream.on('error', callback);
    stream.on('close', callback);
}

function getWinner(doc, callback) {
    var str = doc.user_name+','+doc.name+',';
    Bozuko.models.User.findById(doc.user_id, function(err, user) {
        if (err) return callback(err);
        str += user.services[0].sid + ','+user.email+'\n';
        callback(null, str);
    });
}

function getEntry(doc, callback) {
    var str = doc.user_name+','+doc.timestamp.toISOString()+',';
    Bozuko.models.User.findById(doc.user_id, function(err, user) {
        if (err) return callback(err);
        str += user.services[0].sid + ','+user.email+'\n';
        callback(null, str);
    });
}