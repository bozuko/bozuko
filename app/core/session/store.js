/*!
 * Connect - Bozuko
 * Borrowed liberally from connect-redis
 */

/**
 * Module dependencies.
 */

var Store = require('connect').session.Store;

/**
 * One day in seconds.
 */

var oneDay = 1000 * 60 * 60 * 24;

/**
 * Initialize RedisStore with the given `options`.
 *
 * @param {Object} options
 * @api public
 */

var BozukoStore = module.exports = function BozukoStore(options) {
    options = options || {};
    Store.call(this, options);
    
    // Default reapInterval to 10 minutes
    this.reapInterval = options.reapInterval || (1000 * 60 * 10);
    
    // Default maxAge is one day
    this.maxAge = options.maxAge || oneDay;
    
    if (this.reapInterval !== -1) {
        setInterval(function(self){
            self.reap(self.maxAge);
        }, this.reapInterval, this);
    }
    this.reap();
};

/**
 * Inherit from `Store`.
 */

BozukoStore.prototype.__proto__ = Store.prototype;

/**
 * Reap expired sessions
 */
BozukoStore.prototype.reap = function(){
    var thresh = new Date();
    thresh.setTime(thresh.getTime() - this.maxAge);
    
    Bozuko.models.Session.remove({lastAccess: {$lt: thresh}}, function(error){
        if( error ){
            // log errors?
            console.log(error, error.stack);
        }
    });
}

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

BozukoStore.prototype.get = function(sid, fn){
    var thresh = new Date();
    thresh.setTime(thresh.getTime() - this.maxAge);
    return Bozuko.models.Session.findOne({
        sid: sid,
        lastAccess: {$gt: thresh}
    }, function(error, session){
        if( error ){
            return fn && fn(error);
        }
        var sess = session ? JSON.parse(session.data) : null;
        if( sess && sess.user_id ){
            // lets get the user
            return Bozuko.models.User.findById(sess.user_id, function(error, user){
                if( !error && user ){
                    sess.user = user;
                    delete sess.user_id;
                }
                // else, lets return the session data
                return fn && fn(null, sess);
            });
        }
        else{
            return fn(null, sess);
        }
    });
};

/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

BozukoStore.prototype.set = function(sid, sess, fn){
    var now = new Date();
    Bozuko.models.Session.findOne({sid: sid}, function(error, session){
        if( error ) return fn && fn(error);
        if( !session ) session = new Bozuko.models.Session();
        if( sess.user ){
            // we don't really want to save this whole thing every time...
            sess.user_id = String(sess.user._id);
            delete sess.user;
        }
        session.sid = sid;
        session.lastAccess = new Date();
        session.data = JSON.stringify(sess);
        return session.save(function(error){
            if( error ) return fn && fn(error);
            return fn && fn(null, session.data);
        });
    });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */

BozukoStore.prototype.destroy = function(sid, fn){
    Bozuko.models.Session.remove({sid:sid}, function(error){
        if( error ) console.log(error, error.stack);
        if( fn ) fn(null);
    });
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * @api public
 */

BozukoStore.prototype.length = function(fn){
    Bozuko.models.Session.count(fn);
};

/**
 * Clear all sessions.
 *
 * @param {Function} fn
 * @api public
 */

BozukoStore.prototype.clear = function(fn){
    Bozuko.models.Session.remove({}, fn);
};