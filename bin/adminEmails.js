var bozuko = require('../app/bozuko');
var mail = require('../app/util/mail');
var async = require('async');

var getActiveContests = function(callback) {
    Bozuko.models.Contest.find(
        {start: {$lt: new Date()}, end: {$gt: new Date()}, active: true},
        {_id: 1, name: 1, admin_emails: 1, unique_users: 1},
        function(err, contests) {
            if (err) return callback(err);
            var objects = [];
            contests.forEach(function(contest) {
                objects.push({
                    _id: contest._id,
                    name: contest.name,
                    admin_emails: contest.admin_emails,
                    unique_users: contest.unique_users || 0
                });
            });
            callback(null, objects);
        }
    );
};

var getEntryCount = function(contest_id, callback) {
    Bozuko.models.Entry.count({contest_id: contest_id}, callback);
};

var getTotalShares = function(contest_id, callback) {
    Bozuko.models.Share.count({contest_id: contest_id}, callback);
};

var sendEmails = function(contest, callback) {
  console.log(contest);
   if (!contest.admin_emails) return callback();
   var names = contest.admin_emails.split(',');
   async.forEach(names, function(name, cb) {
       name = name.trim();
       mail.sendView('contest/status', {name: name, contest: contest}, {
           to: contest.admin_emails,
           subject: 'Game Summary - '+contest.name,
           body: 'The following are the totals for the instant win game '+contest.name
       }, function(err, success) {
           if (err || !success) {
               console.error('Failed to send status for contest_id '+contest._id+': '+err);
           }
           cb();
       });
   }, callback);
};

var sendStatsForContest = function(contest, callback) {
    async.parallel([
        function(cb) {
            getEntryCount(contest._id, cb);
        },
        function(cb) {
            getTotalShares(contest._id, cb);
        }
    ], function(err, results) {
        if (err) return callback(err);
        contest.entries = results[0];
        contest.shares = results[1];
        sendEmails(contest, callback);
    });
};

var sendStats = function(contests, callback) {
    async.forEach(contests, sendStatsForContest, callback);
};

var run = function(callback) {
    async.waterfall([
        getActiveContests,
        sendStats
    ], function(err) {
        if (err) console.error(err);
        console.log('Done');
        process.exit();
    });
};

run();

