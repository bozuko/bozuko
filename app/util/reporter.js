var Stream = require('stream').Stream,
    util = require('util'),
    async = require('async'),
    dateFormat = require('dateformat')
;

var page_size = 100;

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

   // write out the summary labels
   res.write('Hourly Summary (EST), Entries, Plays, Prizes Won, Prizes Redeemed\n');

   var concurrency = 10;
   var lines = [];
   var queue = async.queue(function(hours, cb) {
       return play_and_entry_counts(contest._id, hours.current, hours.next, function(err, rv) {
           if (err) return cb(err);
           return prizes_won_and_redeemed(contest._id, hours.current, hours.next, function(err, rv2) {
               lines.push(format_date(hours.current)+","+rv.entries+","+rv.plays+","+rv2.won+","+rv2.redeemed+"\n");
               cb();
           });
       });
   }, concurrency);

   queue.drain = function() {
       lines.sort();
       res.write(lines.join(''));
       res.write('\n\n\n');
       callback();
   };

   var hr = 1000*60*60;
   var start_hr = new Date(contest.start.getFullYear(), contest.start.getMonth(),
       contest.start.getDate(), contest.start.getHours());
   var end = new Date();
   if (end > contest.end) end = contest.end;
   var end_hr = new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours());
   var current_hr = start_hr;
   var next_hr = new Date(current_hr.getTime()+hr);
   while (current_hr <= end_hr) {
       queue.push({current: new Date(current_hr), next: new Date(next_hr)});
       current_hr = next_hr;
       next_hr = new Date(next_hr.getTime()+hr);
   }
}

/*
 * We don't store page_name in play records, but we do in entry records.
 * When we see a new page in an entry map its name to it's id so we can use the 
 * map when writing out plays.
 */
var page_map = {};

function write_details(res, contest) {
  var user_ids = {};
  async.series([
      function(cb) {
          streamEntries(res, contest, user_ids, cb);
      },
      function(cb) {
          streamPlays(res, contest, cb);
      },
      function(cb) {
          streamPrizes(res, contest, cb);
      },
      function(cb) {
          streamUsers(res, contest, user_ids, cb);
      }
  ], function(err) {
      res.end('\n');
      console.log(err);
      console.log('done');
  });
}

function stream(contest, model, write, callback) {
    var total = 0;
    var done;
    async.whilst(function() {
        return !done;
    }, function(cb) {
        getChunk(contest, model, total, function(err, chunk) {
            if (err) return cb(err);
            write(chunk);
            total += chunk.length;
            if (chunk.length < page_size) {
                done = true;
            }
            cb();
        });
    }, callback);
};

function getChunk(contest, model, skip, callback) {
    model
      .find({contest_id: contest._id})
      .limit(page_size)
      .skip(skip)
      .run(callback);
}

function streamEntries(res, contest, user_ids, callback) {
    res.write('Entries\n');
    res.write('Timestamp (UTC), User Id, Place\n');
    stream(contest, Bozuko.models.Entry, writeEntryChunk(res, user_ids), callback);
}

function streamPlays(res, contest, callback) {
    res.write('\n\nPlays\n');
    res.write('Timestamp (UTC), User Id, Place, Prize, Value\n');
    stream(contest, Bozuko.models.Play, writePlayChunk(res), callback);
}

function streamPrizes(res, contest, callback) {
    res.write('\n\nPrizes\n');
    res.write('Timestamp (UTC), User Id, Prize Id, Place, Activity, Value\n');
    stream(contest, Bozuko.models.Prize, writePrizeChunk(res), callback);
}

function streamUsers(res, contest, user_ids, callback) {
    res.write('\n\nUsers\n');
    res.write('User Id, Gender, Friend Count, Hometown, Location, College, Graduation Year, \
        Birthday, Ship Name, Address1, Address2, City, State, Zip \n');

    function write(user) {
        var internal = user.services[0].internal;
        var data = user.services[0].data;
        var str = user.id+','+user.gender+','+internal.friend_count + ',';
        if (data.hometown && data.hometown.name) {
            var names = data.hometown.name.split(',');
            str += names[0] + names[1] + ',';
        } else {
            str += ',';
        }
        if (data.location && data.location.name) {
            var names = data.location.name.split(',');
            str += names[0]+names[1]+',';
        } else {
            str += ','
        }
        if (data.education && data.education.length) {
            data.education.forEach(function(school) {
                if (school.type && school.type === 'College') {
                    if (school.school && school.school.name) {
                      str += school.school.name + ",";
                    } else {
                        str += ',';
                    }
                    if (school.year && school.year.name) {
                        str += school.year.name;
                    } else {
                        str +='';
                    }
                }
            });
        } else {
            str +=',';
        }
        if (data.birthday) {
            str += data.birthday;
        } 
        str += ',';
        var r = [];
        fields = ['ship_name','address1','address2','city','state','zip'];
        fields.forEach(function(f){
            r.push('"'+(user[f]?user[f].replace(/"/gi, '\\"'):'')+'"')
         });
        str += r.join(',');
        str += '\n';
        res.write(str);
    }
    var queue = async.queue(function(user_id, cb) {
        Bozuko.models.User.findOne({_id: user_id.user_id}, function(err, user) {
            if (err) return cb(err);
            if (user) write(user);
            cb();
        });
    }, 10);
    queue.drain = callback;
    Object.keys(user_ids).forEach(function(user_id) {
        queue.push({user_id: user_id});
    });
}

function chunkArray(array) {
    var chunks = [];
    for (var i = 0; i < array.length; i+= page_size) {
        chunks.push(array.slice(i, i+page_size));
    }
    return chunks;
}

function writeEntryChunk(res, user_ids) {
    return function(chunk) {
        chunk.forEach(function(doc) {
            user_ids[doc.user_id] = true;
            page_map[String(doc.page_id)] = doc.page_name;
            res.write(doc.timestamp.toISOString()+","+doc.user_id+","+doc.page_name+",,");
        });
    }
}

function writePlayChunk(res) {
    return function(chunk) {
        chunk.forEach(function(doc) {
            var page_name = page_map[String(doc.page_id)];
            res.write(doc.timestamp.toISOString()+","+doc.user_id+","+page_name+","+
                (doc.prize_name || (doc.free_play ? 'free play' : 'LOSS'))+
                ","+(doc.prize_value || 0));
        });
    }
}

function writePrizeChunk(res) {
    return function(chunk) {
        chunk.forEach(function(doc) {
            var str = dateFormat(doc.timestamp, 'yyyy-mm-dd HH:MM:ss')+","+doc.user_id+","+doc._id+","+doc.page_name+","+
                "WON,NA";
                
            if (doc.redeemed) {
                str += '\n'+dateFormat(doc.timestamp, 'yyyy-mm-dd HH:MM:ss')+","+doc.user_id+","+doc._id+","+doc.page_name+","+
                    "REDEEMED,"+doc.value;
            }
            res.write(str);
        });
    }
}

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
    if (hr < 10) {
        time = '0'+ hr + ':00';
    } else {
        time = String(hr)+':00';
    };
    return str+' '+time;
}

