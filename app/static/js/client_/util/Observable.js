Bozuko.ns('Bozuko.client.util');

/**
 * Obervable Pattern implemented as a mixin class.
 *
 * @class Bozuko.util.client.Observable
 */
Bozuko.client.util.Observable = Compose( function(config){
    this._listeners = {};
    
    if( config && config.events ){
        this.addEvents( config.events );
        delete config.events;
    }
    
    if( config && config.listeners ){
        this.addListener(config.listeners);
        delete config.listeners;
    }
},{
    /**
     * Add event placeholders
     *
     * @param {Mixed} events as array or object literal with event names for keys
     */
    addEvents : function(events){
        if( Bozuko.isArray( events ) ){
            for(var i=0; i<events.length; i++){
                this._listeners[events[i]] = [];
            }
        }
        else if( Bozuko.isObject(events) ){
            for(var i in events){
                this._listeners[i] = [];
            }
        }
    },
    
    /**
     * Add a listener
     *
     * @param {Mixed} event The event name, or an Object containing listener configs with names as keys.
     * @param {Function} fn The function to execute
     * @param {Object} scope The scope to execute the function in
     */
    addListener : function(event, fn, scope){
        
        if( Bozuko.isObject(event) ){
            for(var key in event){
                if( event.hasOwnProperty(key) && key !== 'scope' ){
                    this.addListener(key, Bozuko.isFunction(event[key]) ? event[key] : event[key].handler, event[key].scope || event.scope || null );
                }
            }
            return;
        }
        
        if( ~this.findListener(event, fn, scope) ) return;
        this._listeners[event].push({fn:fn, scope:scope});
    },
    
    /**
     * Remove a listener
     *
     * @param {Mixed} event The event name
     * @param {Function} fn The listening function
     * @param {Object} scope The scope that the function was added with
     */
    removeListener : function(event, fn, scope){
        var i =0;
        if( !~(i = this.findListener(event, fn, scope)) ) return;
        this._listeners[event].splice(i,1);
    },
    
    /**
     * Find a listener by index
     *
     * @param {Mixed} event The event name
     * @param {Function} fn The listening function
     * @param {Object} scope The scope that the function was added with
     * @return {Number} The index of the listener in its corresponding array, or -1 if not found
     */
    findListener : function(event, fn, scope){
        if( !this._listeners[event] ) this._listeners[event] = [];
        for( var i=0; i<this._listeners[event].length; i++ ){
            var listener = this._listeners[event][i];
            if( listener.fn == fn && listener.scope == scope ) return i;
        }
        return -1;
    },
    
    /**
     * Fire an event
     *
     * @param {string} event The event to fire
     * @param {arg1} arg1 optional arguments to pass to the listening functions
     */
    fireEvent : function(){
        
        var args = [].slice.call(arguments);
        if( !args.length ) return;
        
        var event = args.shift(),
            listeners = this._listeners[event];
            
        if( !listeners || !listeners.length ) return;
        
        for(var i=0; i<listeners.length; i++){
            var listener = listeners[i];
            listener.fn.apply(listener.scope || this, args);
        }
    },
    
    /**
     * Add a listener
     *
     * @param {Mixed} event The event name, or an Object containing listener configs with names as keys.
     * @param {Function} fn The function to execute
     * @param {Object} scope The scope to execute the function in
     */
    on : function(){
        this.addListener.apply( this, arguments );
    },
    
    /**
     * Remove a listener
     *
     * @param {Mixed} event The event name
     * @param {Function} fn The listening function
     * @param {Object} scope The scope that the function was added with
     */
    un : function(){
        this.removeListener.apply( this, arguments );
    }
});