#!/usr/bin/env node

var fs = require('fs'),
    async = require('async'),
    exec = require('child_process').exec
    ;

var argv = require('optimist')
    .default('out', process.env.HOME+'/gencsv_out.csv')
    .argv
    ;

if (!argv.contest) throw new Error("Need a contest to simulate");

var path = process.env.HOME+'/bozuko/app/core/engine/simulator/input/'+argv.contest;

var plays = [];
var wins = [];
var redistributions = [];
var start;
var end;

async.series([get_contest, get_wins_and_redists, get_plays, output_data_file]);

function get_contest(cb) {
    return fs.readFile(path+'/contest.json', function(err, json) {
        if (err) return cb(err);
        var contest = JSON.parse(json);
        start = new Date(contest.start.$date);
        end = new Date(contest.end.$date);
        cb();
    });
}

function get_wins_and_redists(cb) {
    return fs.readFile(path+'/results.json', 'utf8', function(err, jsonlines) {
        var jsonarray = jsonlines.split("\n");
        jsonarray.forEach(function(json) {
            var result = null;
            try {
               result = JSON.parse(json);
            } catch (err) {
            }
            if (result && result.win_time) wins.push(new Date(result.win_time['$date']));
            if (result && result.history.length > 1) {
                for (var j = 1; j < result.history.length; j++) {
                    redistributions.push(new Date(result.history[j].move_time['$date']));
                }
            }
        });
        return cb();
    });
}

function get_plays(cb) {
    return fs.readFile(path+'/plays.json', 'utf8', function(err, jsonlines) {
        var jsonarray = jsonlines.split("\n");
        jsonarray.forEach(function(json) {
            var result = null;
            try {
               result = JSON.parse(json);
            } catch (err) {
            }
            if (result) {
                var timestamp = new Date(result.timestamp.$date);
                plays.push(timestamp);
            }
        });
        return cb();
    });
}

function output_data_file(cb) {
    var buckets = createBuckets();

    var stream = fs.createWriteStream(argv.out);
    stream.write('Time,Hour,Plays,Wins,Redist\n');
    var keys = Object.keys(buckets);
    var ct = 0;
    keys.forEach(function(k) {
        ct = ct + 1;
        stream.write(k+','+ct+','+buckets[k].plays+','+buckets[k].wins+','+buckets[k].redist+'\n');
    });
    stream.end();
    stream.destroySoon();
    stream.on('close', cb);
}

function buildKey(ts) {
 return ''+ts.getFullYear()+'-'+(ts.getMonth()+1)+'-'+ts.getDate()+'T'+ts.getHours();
}

var hr = 1000*60*60;

function empty_buckets() {
    var start_ms = start.getTime();
    var end_ms = end.getTime();
    var cur_ms = start_ms;
    var key;
    var buckets = {};
    while (cur_ms < end_ms) {
        key = buildKey(new Date(cur_ms));
        buckets[key] = {
            plays: 0,
            wins: 0,
            redist: 0
        };
        cur_ms += hr;
    }   
    return buckets;
}

function createBuckets() {
    console.log("plays = "+plays.length);
    console.log("wins = "+wins.length);
    console.log("redistributions = "+redistributions.length);
    console.log('lookback_window = '+
       (end.getTime() - start.getTime())/56/5);
    console.log('throwahead window = '+
       (end.getTime() - start.getTime())/56*10);
    
    var buckets = empty_buckets();

    plays.forEach(function(ts) {
        var key = buildKey(ts);
        buckets[key].plays++;
    });
    wins.forEach(function(ts) {
        var key = buildKey(ts);
        buckets[key].wins++;
    });
    redistributions.forEach(function(ts) {
        var key = buildKey(ts);
        buckets[key].redist++;
    });
    return buckets;
}
