var events = require('events'),
    util = require('util')
    ;

var PubSub = module.exports = function(){
    var self = this;
    
    self.model = Bozuko.models.Message;
    self.cursor = null;
    self.running = false;
    self.last_timestamp = Date.now();
    self.max = 100;
    self.threshold = Bozuko.getConfigValue( 'pubsub.cleanup.threshold', 1000 * 60 * 60 * 2); // 2 hours
    self.poll_timeout = null;
    self.poll_interval = Bozuko.getConfigValue( 'pubsub.poll.interval', 500 );
    self.cleanup_interval = Bozuko.getConfigValue( 'pubsub.cleanup.interval', 1000 * 60 * 10); // 10 minutes
    self.cleanup_timeout = null;
    self.start();
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
    
    this.model.find({timestamp: {$gt: self.last_timestamp}}, {}, {sort: {timestamp:1}}, function(error, items){
        if( error ) return console.log(error.message, error.stack);
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
    self.last_timestamp = item.timestamp;
    self.emit( item.type, item.content );
};

PubSub.prototype.publish = function(type, content){
    var self = this;
    
    var msg = new self.model({
        timestamp: new Date(),
        type: type,
        content: content
    });
    
    msg.save(function(){
        /**
         * TODO - decide if we should just wait on this.
         */
        self.poll(true);
    });
};

PubSub.prototype.subscribe = function(type, callback){
    this.on(type, callback);
};

PubSub.prototype.unsubscribe = function(type, callback){
    this.removeListener(type, callback);
};
