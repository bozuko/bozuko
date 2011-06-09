var events = require('events'),
    util = require('util')
    ;

var PubSub = module.exports = function(){
    var self = this;
    
    self.model = Bozuko.models.Message;
    self.cursor = null;
    self.running = true;
    self.last_timestamp = Date.now();
    self.max = 100;
    self.pollTimeout = null;
    self.interval = 500;
    self.poll = function(){
        return self._poll();
    };
    self._poll();
};

util.inherits( PubSub, events.EventEmitter );

PubSub.prototype._poll = function(){
    var self = this;
    
    this.model.find({timestamp: {$gt: self.last_timestamp}}, {}, {sort: {timestamp:1}}, function(error, items){
        if( error ) return console.log(error.message, error.stack);
        items.forEach(function(item){
            self.onItem(item);
        });
        if( self.running ){
            self.pollTimeout = setTimeout(self.poll, self.interval);
        }
        return false;
    });
};

PubSub.prototype.cleanup = function(){
    
}


PubSub.prototype.onItem = function(item){
    var self = this;
    if( !item ){
        // wha?
        console.log('PubSub.onItem with no item');
        return;
    }
    // get the timestamp
    self.last_timestamp = item.timestamp;
    console.log('onItem', item);
};

PubSub.prototype.publish = function(type, content){
    var msg = new this.model({
        timestamp: Date.now(),
        type: type,
        content: content
    });
    msg.save();
};

PubSub.prototype.subscribe = function(type, callback){
    
};

PubSub.prototype.unsubscribe = function(type, callback){
    
};
