var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    pg = require('../core/pg.js');
;

var Entry = module.exports = function() {
};

Entry.createTable = function(pg, callback) {
  pg.query('CREATE TABLE entries ( \
    contest_id                text PRIMARY KEY, \
    page_id                   text, \
    apikey_id                 text, \
    user_id                   text, \
    user_name                 text, \
    page_name                 text, \
    type                      text, \
    device                    text, \
    url                       text, \
    action_id                 text, \
    timestamp                 timestamp DEFAULT CURRENT_TIMESTAMP, \
    wall_posts                integer DEFAULT 0, \
    tokens                    integer CONSTRAINT entry_tokens_0 NOT NULL CHECK (tokens >= 0), \
    initial_tokens            integer, \
    win                       boolean \
  );', callback);
};

Entry.createIndexes = function(pg, callback) {
  async.forEach([
    'CREATE INDEX entries_user_name ON entries (user_name)',
    'CREATE INDEX entries_user_id ON entries (user_id)',
    'CREATE INDEX entries_page_name ON entries (page_name)',
    'CREATE INDEX entries_timestamp ON entries (timestamp)',
    'CREATE INDEX entries_contest_id_user_id_timestamp ON entries (contest_id, user_id, timestamp)'
  ], function(query, cb) {
    pg.query(query, cb);
  }, callback);
};

Entry.dropTable = function(pg, callback) {
  pg.query('DROP TABLE entries', callback);
};

// This should probably be a prototype method that saves the non-function members of the object
// I did it like this just for expediency.
Entry.save = function(opts, callback) {
    var sql = pg.sqlize(opts);
    pg.query('INSERT INTO entries '+sql.query, sql.args, callback);
};

Entry.getUserInfo = function(contest_id, user_id, callback) {
    var min_expiry_date = new Date(Date.now() - Bozuko.config.entry.token_expiration);
    pg.query('SELECT * FROM entries WHERE contest_id = $1 AND user_id = $2 AND timestamp >= $3;', 
        [contest_id, user_id, min_expiry_date], function(err, entries) {
            if (err) return callback(err);
            var tokens = 0;
            var last_entry = null;
            var earliest_active_entry_time = null;

            entries.forEach(function(entry) {
                if (!earliest_active_entry_time || (entry.timestamp < earliest_active_entry_time)) {
                    earliest_active_entry_time = entry.timestamp;
                }
                tokens += entry.tokens;
            });
            
            return pg.query('SELECT * FROM entries WHERE contest_id = $1 AND user_id = $2 ORDER BY \
                timestamp DESC LIMIT 1;', [contest_id, user_id], function(error, last_entries){
                    if( error ) return callback(error);
                    if( last_entries && last_entries.length ){
                        last_entry = last_entries[0];
                    }
                    return callback(null, {
                        tokens: tokens,
                        last_entry: last_entry,
                        earliest_active_entry_time: earliest_active_entry_time
                    });
                }
            );
        }
    );
};

Entry.spendToken = function(contest_id, user_id, min_expiry_date, callback) {
    var query = 'UPDATE entries SET tokens = tokens - 1 \
        WHERE contest_id = $1 AND user_id = $2 AND timestamp >= $3 AND tokens > 0 \
        LIMIT 1 RETURNING *';
    pg.query(query, [contest_id, user_id, min_expiry_date], function(err, result) {
        if (err) return callback(err);
        var entry = result.rows[0];
        // If we crash here the user will lose a token. Don't worry about it.
        if (!entry) {
            return callback(Bozuko.error("contest/no_tokens"));
        }
        return callback(null, entry);
    });
};

Entry.incrementToken = function(contest_id, user_id, min_expiry_date, callback) {
    var query = 'UPDATE entries SET tokens = tokens + 1 \
        WHERE contest_id = $1 AND user_id = $2 AND timestamp >= $3 LIMIT 1 RETURNING *';
    pg.query(query, [contest_id, user_id, min_expiry_date], function(err, result) {
        if (err) return callback(err);
        return callback(null, result.rows[0]);
    });
};

Entry.getDistinctLikers = function(page_id, callback) {
    var query = 'SELECT user_id WHERE page_id = $1 AND type = $2 GROUP BY user_id;';
    pg.query(query, [page_id, 'facebook/like'], function(err, result) {
        if (err) return callback(err);
        callback(null, result.rows || []);
    });
};

Entry.getFirstLike = function(user_id, page_id, callback) {
    var query = 'SELECT contest_id, timestamp \
        WHERE user_id = $1 AND page_id = $2 AND type = \'facebook/like\' \
        ORDER BY timestamp ASC LIMIT 1;';
    pg.query(query, [user_id, page_id], function(err, result) {
        if (err) return callback(err);
        return callback(null, result.rows[0]);
    });
};

Entry.count = function(opts, callback) {
    var query = 'SELECT COUNT(*) FROM entries WHERE ';
    if (opts.page_id) {
        if (Array.isArray(opts.page_id)) {
            query += 'page_id IN $1';
        } else {
            query += 'page_id = $1';
        }
        if (opts.contest_id) {
            query += ' AND contest_id = $2';
        }
    } else {
        if (opts.contest_id) {
            query += 'contest_id = $2';
        }
    }
    pg.query(query, [opts.page_id, opts.contest_id], callback);
};

Entry.search = function(opts, callback) {
    var query = 'SELECT * FROM entries WHERE ';
    var params = []; 
    var search = '(^|\\s)'+opts.search;
    if (opts.page_id) {
        if (Array.isArray(opts.page_id)) {
            query += 'page_id IN $1';
        } else {
            query += 'page_id = $1';
        }
        params.push(opts.page_id);
        if (opts.contest_id) {
            query += ' AND contest_id = $2'; 
            params.push(opts.contest_id);
            if (opts.search) {
                query += ' AND user_name ~* $3';
                params.push(search);
            }
        } else {
            if (opts.search) {
                query += ' AND user_name ~* $2';
                params.push(search);
            }
        }
    } else {
        if (opts.contest_id) {
            query += 'contest_id = $1';
            params.push(opts.contest_id);
            if (opts.search) {
                query += ' AND (user_name ~* $2 OR page_name ~* $2)';
                params.push(search);
            }
        } else {
            if (opts.search) {
                query += 'user_name ~* $1 OR page_name ~* $1';
                params.push(search);
            }
        }
    }
    query += ' LIMIT $'+params.length;
    query += ' OFFSET $'+(params.length+1);
    params.push(opts.limit, opts.skip);
    query += ' ORDER BY timestamp DESC';
    pg.query(query, params, function(err, result) {
        if (err) return callback(err);
        return callback(null, result.rows);
    });
};
