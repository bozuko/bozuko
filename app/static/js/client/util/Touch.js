(function(){
    
    var addListener = Ext.EventManager.addListener,
        removeListener = Ext.EventManager.removeListener;
        
    Ext.EventManager.on = Ext.EventManager.addListener = function(element, eventName, fn, scope, options){
        
        if( eventName == 'click' || eventName == 'mousedown' ){
            addListener(element, 'touchstart', fn, scope, options);
        }
        addListener(element, eventName, fn, scope, options);
    };
    
    Ext.EventManager.un = Ext.EventManager.removeListener = function(element, eventName, fn, scope){
        if( eventName == 'click' || eventName == 'mousedown' ){
            removeListener(element, 'touchstart', fn, scope);
        }
        removeListener(element, eventName, fn, scope);
    };
})();