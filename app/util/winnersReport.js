var Stream = require('stream').Stream,
    util = require('util'),
    async = require('async'),
    dateFormat = require('dateformat')
;

var page_size = 100;

exports.stream = function(contest, res) {
    res.header('content-type','text/csv');
    res.header('content-disposition', 'attachment; filename=winnersList-'+
        slugify(contest.game_config.name)+'.csv');
    streamWinners(contest, res, function(err) {
        if (err) {
            var str = 'Error streaming winners report for contest '+contest.id+'. '+err;
            res.end(str+'\n');
            console.error(str);
        } else {
            console.log('Done streaming winners for contest '+contest.game_config.name);
            res.end('\n');
        }
    });
        
};

function streamWinners(contest, res, callback) {
    
    var c={};
    
    res.write('WINNERS\n');
    res.write('Timestamp, Name, Prize, Facebook Id, Email, Ship-To Name, Address1, Address2, City, State, Zip\n');
    var stream = Bozuko.models.Prize.find({contest_id: contest._id}, 
        {timestamp:1, user_name:1, name: 1, user_id: 1}, {timestamp:1}).stream();
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

function getWinner(doc, callback) {
    var str = dateFormat(doc.timestamp, 'yyyy-mm-dd HH:MM:ss')+','+doc.user_name+','+doc.name+',';
    Bozuko.models.User.findById(doc.user_id, 
        {services: 1, email: 1, ship_name: 1, address1: 1, address2: 1, city: 1, state: 1, zip: 1},
        function(err, user) {
            if (err) return callback(err);
            str += user.services[0].sid + ','+user.email;
            
            // add address
            ['ship_name','address1','address2','city','state','zip'].forEach(function(f){
                str+=(','+ ('"'+(user[f]||"").replace(/"/, '\\"')+'"') );
            });
            
            str+="\n";
            callback(null, str);
        }
   );
}


function slugify(name) {
    return name.replace(/\s/, '_', 'g');
}
