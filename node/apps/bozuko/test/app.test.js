
// Run $ expresso

/**
 * Module dependencies.
 */

var assert = require('assert');
var app = require('../app');

// Node will not exit the event loop until all external connections are closed!
// FIXME: This is should really be part of a testsuite teardown function.
setTimeout(function() {Bozuko.db.conn().disconnect()}, 1000);

module.exports = {
  'GET /': function(beforeExit) {
      assert.response(app, { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res){
          assert.includes(res.body, '<title>Bozuko</title>');
      });
      
      beforeExit(function() {
      });
  }
};