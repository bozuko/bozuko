Ext.define('Bozuko.lib.PubSub',{
    
    requires: [
        'Ext.Ajax'
    ],
    
    retryAttempts: 5,
    
    constructor : function(){
        this.listening = false;
        this.listeners = {};
        this.fails = 0;
    },
    
    listen : function(){
        this.listening = true;
        this.request();
    },
    
    stopListening : function(){
        this.listening = false;
        if( this.activeRequest && this.activeRequest.xhr  ) this.activeRequest.xhr.abort();
    },
    
    request : function(){
        var me = this;
        
        if( !me.listening ) return;
        var listeners = me.getListeners();
        if( !listeners || !Ext.Object.getKeys(listeners).length ) return;
        
        var options = {
            timeout: 60000,
            url:'/listen',
            method:'post',
            callback: me.handleResponse,
            scope: me,
            jsonData:{
                listeners:listeners
            }
        };
        console.log(me.since);
        if( me.since ){
            options.jsonData.since = me.since;
        }
        if( me.activeRequest && me.activeRequest.xhr ) me.activeRequest.xhr.abort();
        me.activeRequest = Ext.Ajax.request(options);
    },
    
    getListeners : function(){
        var me = this, listeners = {};
        
        Ext.Object.each(me.listeners, function(event, filters){
            Ext.Object.each(filters, function(filterKey, filter){
                if( !listeners[event] ) listeners[event] = [];
                listeners[event].push(filter.conditions);
            });
        });
        
        return listeners;
    },
    
    subscribe : function(event, filter, callback){
        var me = this;
        
        if( !me.listeners[event] ) me.listeners[event] = {};
        var filterKey = Ext.encode(filter);
        var listener = me.listeners[event];
        if( listener[filterKey] ){
            // check for dups
            if( !~listener[filterKey].callbacks.indexOf(callback) ){
                listener[filterKey].callbacks.push( callback );
            }
        }
        else{
            listener[filterKey]= {
                conditions: filter,
                callbacks:[callback]
            };
        }
        me.listen();
    },
    
    /**
     * filter needs to be passed in the same exact form as it was
     * when subscribed to
     */
    unsubscribe : function(event, filter, callback){
        var me = this;
        
        if( !me.listeners[event] ) return;
        var filterKey = Ext.encode(filter);
        var listener = me.listeners[event];
        if( !listener[filterKey] || !listener[filterKey].callbacks || !listener[filterKey].callbacks.length ){
            return;
        }
        var index = -1;
        if( ~(index = listener[filterKey].callbacks.indexOf(callback)) ){
            listener[filterKey].callbacks.splice(index,1);
        }
        if( !listener[filterKey].callbacks.length ){
            delete listener[filterKey];
        }
        if( !Ext.Object.getKeys(listener).length ){
            delete me.listeners[event];
        }
    },
    
    handleResponse : function(options, success, response){
        var me = this;
        // forget it
        if( !me.listening ) return;
        if( success ){
            try{
                var data = Ext.decode( response.responseText );
                // data should be an array of events
                Ext.Array.each(data, function(item, index){
                    try{
                        var timestamp = new Date();
                        timestamp.setTime(Date.parse(item.timestamp));
                        item.timestamp = timestamp;
                        me.onItem(item, index==data.length-1);
                    }catch(e){
                        console.log(e);
                    }
                });
            }
            catch(e){
                console.log(e);
                // error reading data from server...
                me.fails++;
            }
        }
        else{
            me.fails++;
        }
        me.request();
    },
    
    onItem : function(item, last){
        var me = this,
            _id = item._id,
            event = item.type,
            message = item.message,
            timestamp = item.timestamp,
            filters = me.listeners[item.event],
            star_filters = me.listeners['*'];
            
        if( !filters && !star_filters ){
            return;
        }
        Ext.Array.each([filters, star_filters], function(filters){
            if( !filters ) return;
            Ext.Object.each( filters, function(key, filter){
                // lets see if this object satisfies the conditions
                var satisfied = false;
                if( filter.conditions === true ){
                    // this is fine...
                    satisfied = true;
                }
                else{
                    var match = 0, count = 0;
                    Ext.Object.each( filter.conditions, function(key, value){
                        count++;
                        if( message[key] == value ) match++;
                    });
                    if( match === count ){
                        satisfied = true;
                    }
                }
                if( satisfied ){
                    Ext.Array.each( filter.callbacks, function(callback){
                        callback(message, event, timestamp)
                    });
                }
            });
        });
        if( last ){
            me.since = _id;
        }
    }
    
}, function(){
    Bozuko.PubSub = new this();
});