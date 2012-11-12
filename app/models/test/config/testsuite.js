
process.env.NODE_ENV='test';

var bozuko = require('../../../../app/bozuko');

// Initialize Bozuko
bozuko.getApp();

var pg = require('../../../core/pg');
var Entry = require('../../entry');

var testsuite = module.exports = {};

testsuite.setup = function(callback) {
    async.series([cleanupTable, createTable, createIndexes], callback);
};

function cleanupTable(callback) {
    pg.getConn(function(err, client) {
        if (err) return callback(err);
        Entry.dropTable(client, function(err) {
            // Ignore errors due to table not existing
            callback();
        });
    });
}

function createTable(callback) {
    pg.getConn(function(err, client) {
        if (err) return callback(err);
        Entry.createTable(client, callback);
    });
}

function createIndexes(callback) {
    pg.getConn(function(err, client) {
        if (err) return callback(err);
        Entry.createIndexes(client, callback);
    });
}
