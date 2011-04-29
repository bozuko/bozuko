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

var link = '/api';

function get_api(test, count, cb){
    assert.response(test, Bozuko.app,
        {url: link+'/?token='+token},
        ok,
        function(res) {
            if( --count > 0 ) get_api(test, count, cb);
            else cb();
        });
}

exports.get_root = function(test) {
    
    // lets setup all of our increments
    var concurrent = [];
    for(var i=0; i<10; i++){
        concurrent[i] = 10000;
        get_api( test, concurrent[i], function(){
            var still_going = false;
            for( var i=0; i<concurrent.length && !still_going; i++){
                if( concurrent[i].length ) still_going = true;
            }
            if( !still_going ) test.done();
        });
    }
    
};
