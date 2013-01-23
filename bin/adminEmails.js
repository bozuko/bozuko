var bozuko = require('../app/bozuko');
var mail = require('../app/util/mail');
var async = require('async');

var getUniqueCount = function( contest, cb ){
    
    /**
     * I am going back to querying the database here because for some reason the
     * counts are way off. Since this only runs once per day, and we don't have
     * a ton of contests running at the same time right now, I don't think the
     * performance hit will be that bad - its the same as just hitting admin.
     * If anything, maybe we space out each email so we aren't pounding with these
     * queries in quick succession.
     */
    
    // if we wanted to flip it back to just looking at the counter, just use:
    //
    // if( 1) return cb(null, contest.unique_users);
    
    var selector = {
        contest_id: contest._id
    };
    Bozuko.models.Entry.distinct('user_id', selector, function(error, results){
        console.log(results);
        if( error ) return cb(error);
        return cb(null, results.length);
    });
};

var getActiveContests = function(callback) {
    Bozuko.models.Contest.find(
        {start: {$lt: new Date()}, end: {$gt: new Date()}, active: true, admin_emails: {$exists:true, $ne: ''}, },
        {_id: 1, game_config: 1, admin_emails: 1, unique_users: 1},
        function(err, contests) {
            if (err) return callback(err);
            var objects = [];
            return async.forEach(contests, function(contest, cb) {
                getUniqueCount(contest, function(error, unique_count){
                    if( error ) return cb(error);
                    objects.push({
                        _id: contest._id,
                        name: contest.game_config.name,
                        admin_emails: contest.admin_emails,
                        unique_users: unique_count || 0
                    });
                    return cb();
                });
            }, function(error){
                if(error) console.log(error);
                callback(error, objects);
            });
            
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
       mail.sendView('contest/status', {name: name, contest: contest, layout: 'statusLayout.jade'}, {
           to: name,
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

