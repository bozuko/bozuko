
// Run $ expresso

/**
 * Module dependencies.
 */

var assert = require('assert');
var app = require('../app');

module.exports = {
  'GET /': function(beforeExit) {
      assert.response(app, { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res){
          assert.includes(res.body, '<title>Bozuko</title>');
      });
      
      beforeExit(function() {
          Bozuko.db.conn().disconnect();
      });
  }
};