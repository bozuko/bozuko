var Load = require('spray'),
    inspect = require('util').inspect,
    https = require('https')
;

process.on('exit', function() {
    console.log(load.stats);
});

var options = {
    protocol: 'https',
    hostname: 'playground.bozuko.com',
    port: 8000,
    rate: 100, // req/sec
    time: 300, // sec
    timeout: 20000, //ms  -- socket timeout
    max_sessions: 500,
//    maxSockets: 500,
    enable_cube: true,
    sessions: [{
        weight: 1,
        start: start_session
    }]
};

var load = new Load(options);
load.run(function(err, results) {
    if (err) return console.error("Err = "+err);
    console.log("\nresults = "+require('util').inspect(results));
});

load.on('sec', function(stats) {
    console.log("ONE SEC!");
});

load.on('min', function(stats) {
    console.log("ONE MIN");
    console.log(stats);
});

function start_session(callback) {
    var http = load.http;
    return http.request({
        headers: {'content-type': 'application/json'},
        encoding: 'utf-8',
        path: '/api',
        method: 'GET'
    }, function(err, res) {
        if (err) return callback(err);
        if (res.statusCode != 200) return callback(res.statusCode);
        return callback(null);
    });
}
