var mongo = require('mongodb'),
    Db = mongo.Db,
    Server = mongo.Server,
    ReplSetServers = mongo.ReplSetServers
;
var inspect = require('util').inspect;

exports['findAndModify - w:3 timeout'] = function(test) {
    var replSet = new ReplSetServers([
        new Server('pgdb1', 27017)
    ], {rs_name: 'playground'});

    var db = new Db('test', replSet);

    db.open(function(err, client) {
        if (err) console.log(err);
        test.ok(!err);

        client.dropDatabase(function(err) {
            test.ok(!err);

            var collection = new mongo.Collection(client, 'stuff');
            collection.insert({a:1, b: 'red'}, {safe: {w:2, wtimeout:5000}}, function(err, docs) {
                test.ok(!err);
                var doc = docs[0];
                collection.findAndModify(
                    {_id: doc._id},
                    [],
                    {$inc: {a: 1}, $set : {b: 'blue'}},
                    {new: true, safe: {w:3, wtimeout: 5000}},
                    function(err, contest) {
                        test.ok(err);
                        test.ok(!contest);
                        db.close();
                        test.done();
                    }
                );
            });
        });
    });
};


