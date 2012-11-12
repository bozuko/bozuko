var pg = require('pg');
var db = module.exports = {};

var connStr = 'tcp://bozuko:afds33252*)CDExxl34444fadfadsx0uu8@localhost:5433/';

db.init = function(env) {
  connStr += 'bozuko_'+env;
};

db.getConn = function(callback) {
  pg.connect(connStr, callback);
};

db.query = function(query, args, callback) {
  if (typeof args === 'function') {
    callback = args;
    args = [];
  }
  db.getConn(function(err, client) {
    if (err) return callback(err);
    client.query(query, args, callback);
  });
}

db.sqlize = function(opts) {
  var columns = '(';
  var values = ' values(';
  var args = [];
  var keys = Object.keys(opts); 
  var key = keys[0];
  for (var i = 0; i < keys.length; i++) {
    key = keys[i]
    if (i === keys.length - 1) {
      columns += key + ')';
      values += '$'+(i+1)+')';
    } else {
      columns += key + ',';
      values += '$'+(i+1)+',';
    }
    args.push(opts[key]);
  }
  return {
    query: columns + values, 
    args: args
  }
};
