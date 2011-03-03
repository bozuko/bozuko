var express = require('express');
var bozuko = require('../bozuko');
var assert = require('assert');

assert.keys = function(object, properties) {
    properties.forEach(function(prop) {
	assert.ok(prop in object);
    });
};

exports.setup = function(fn) {
    bozuko.app = express.createServer();
    bozuko.run('test');
    fn();
};

exports.teardown = function() {
    setTimeout(function(){bozuko.db.conn().disconnect();}, 1);
};