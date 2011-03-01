var express = require('express');
var bozuko = require('../bozuko');

exports.setup = function(fn) {
    bozuko.app = express.createServer();
    bozuko.run('test');
    fn();
};

exports.teardown = function() {
    setTimeout(function(){bozuko.db.conn().disconnect();}, 1);
};