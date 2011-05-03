var print = require('util').debug;
var assert = require('assert');
var async = require('async');
var testsuite = require('./config/testsuite');

var token = assert.token;
var challenge = assert.challenge;
var phone = assert.phone;
var headers = {'content-type': 'application/json'};
var ok = {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8'}};
var bad = {status: 500, headers: {'Content-Type': 'application/json; charset=utf-8'}};
var auth, tokens, wins=0, prizes_link, prizes;

exports.setup = function(test) {
    testsuite.setup(test.done);
    auth = Bozuko.require('core/auth');
};

var link = '/api',
    concurrent_count = 4,
    total_count = 100000,
    slow_down = 97000,
    slow_down2 = 92000,
    speed_up = 60000,
    slow_time = 100,
    slow_time2 = 300
    ;

function get_api(test, count, cb){
    assert.response(test, Bozuko.app,
        {url: link+'/?token='+token},
        ok,
        function(res) {
            var timeout = 0;
            if( count < slow_down2 ){
                console.log('slow down2');
                timeout = slow_time2;
            }else if(count < slow_down ){
                console.log('slow down');
                timeout = slow_time;
            }
            if( --count > 0 ) setTimeout( function(){
                get_api(test, count, cb);
            }, timeout);
            else cb();
        });
}

exports.get_root = function(test) {
    
    // lets setup all of our increments
    var concurrent = [];
    for(var i=0; i<concurrent_count; i++){
        concurrent[i] = total_count;
        get_api( test, concurrent[i], function(){
            var still_going = false;
            for( var i=0; i<concurrent.length && !still_going; i++){
                if( concurrent[i].length ) still_going = true;
            }
            if( !still_going ) test.done();
        });
    }
    
};
