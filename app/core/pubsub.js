var events = require('events'),
    util = require('util'),
    filter = Bozuko.require('util/functions').filter,
    ObjectId = require('mongoose').Types.ObjectId
    ;

var PubSub = module.exports = function(){
    var self = this;
    events.EventEmitter.apply(this);
    self.model = Bozuko.models.Message;
    self.cursor = null;
    self.timestamp = new Date();
    self.running = false;
    self.last_id = false;
    self.max = 100;
    self.threshold = Bozuko.cfg( 'pubsub.cleanup.threshold', 1000 * 60 * 60 * 2 ); // 2 hours
    self.poll_timeout = null;
    self.poll_interval = Bozuko.cfg( 'pubsub.poll.interval', 1000 );
    self.cleanup_interval = Bozuko.cfg( 'pubsub.cleanup.interval', 1000 * 60 * 10 ); // 10 minutes
    self.cleanup_timeout = null;
    /**
     * Hack to stagger the listeners
     */
    setTimeout(function(){
        if( Bozuko.isMaster ) return;
        
        var stagger = self.poll_interval / 4,
            id = parseInt(process.title.match(/[0-9]+/)[0], 10);
        
        setTimeout( function(){
            self.start();
        }, id * stagger );
    }, 500);
};

util.inherits( PubSub, events.EventEmitter );

PubSub.prototype.poll = function(now){
    var self = this;
    
    clearTimeout( self.poll_timeout );
    
    if( now ) return self._poll();
    
    self.poll_timeout = setTimeout(function(){
        self._poll();
    }, self.poll_interval);
    return null;
};

PubSub.prototype._poll = function(){
    var self = this;
    
    var selector = {};
    if( self.last_id ){
        selector._id = {$gt: self.last_id};
    }
    else{
        selector.timestamp = {$gt: self.timestamp};
    }
    
    this.model.find(selector, {}, {sort: {_id:1}, limit: 10}, function(error, items){
        if( error ){
            return console.error(error);
        }
        items.forEach(function(item){
            self.onItem(item);
        });
        return self.running ? self.poll() : false;
    });
};


PubSub.prototype.cleanup = function(now){
    var self = this;
    
    clearTimeout( self.cleanup_timeout );
    
    if( now ) return self._cleanup();
    
    self.cleanup_timeout = setTimeout(function(){
        self._cleanup();
    }, self.cleanup_interval);
    
    return null;
};

PubSub.prototype._cleanup = function(){
    var self = this,
        threshold = new Date();
    
    threshold.setTime( threshold.getTime() - self.threshold );
    self.model.remove({timestamp: {$lt: threshold}}, function(){
        return self.running ? self.cleanup() : false;
    });
};

PubSub.prototype.start = function(){
    var self = this;
    if( self.running ) return;
    self.running = true;
    self.poll(true);
    self.cleanup();
};

PubSub.prototype.stop = function(){
    var self = this;
    if( !self.running ) return;
    self.running = false;
    clearTimeout( self.poll_timeout );
    clearTimeout( self.cleanup_timeout );
};

PubSub.prototype.onItem = function(item){
    var self = this;
    if( !item ){
        return;
    }
    // get the timestamp
    self.last_id = item._id;
    // let our wildcard listeners in on it
    self.emit( '*', item);
    // tell the specific listeners whats up
    self.emit( item.type, item );
};

PubSub.prototype.publish = function(type, message){
    var self = this;
    
    Bozuko.models.Sequence.next('messages', function(error, id){
        if( error ){
            console.error(error);
            return;
        }
        var msg = new self.model({
            _id : id,
            timestamp: new Date(),
            type: type,
            message: filter(message)
        });
        
        msg.save(function(){
           
        });
    });
};

PubSub.prototype.since = function(id, callback){
    this.model.find({_id: {$gt: id}}, {}, {sort: {_id: 1}, limit: 10}, callback);
    return callback(null, []);
};

PubSub.prototype.subscribe = function(type, callback){
    // count events
    //console.error('pubsub subscribe: '+type+' '+util.inspect( this._events ) );
    this.on(type, callback);
};

PubSub.prototype.unsubscribe = function(type, callback){
    //console.error('pubsub unsubscribing: '+type+' '+util.inspect( this._events ) );
    this.removeListener(type, callback);
};
