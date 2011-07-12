Ext.define('Bozuko.store.Winners', {
    extend: 'Ext.data.Store',
    
    requires: [
        'Bozuko.model.Winner',
        'Bozuko.lib.PubSub',
        'Ext.data.reader.Json'
    ],
    
    model: 'Bozuko.model.Winner',

    constructor : function(){
        var me = this;
        me.last = {};
        me.listening = false;
        
        me.callParent(arguments);
        me.on('beforeload', me.onBeforeLoad, me);
        me.on('load', me.startListening, me);
        
    },
    
    onBeforeLoad : function(store, operation){
        var me = this;
        
        if( !me.page_id && !me.contest_id ) return;
        if( !operation.params ) operation.params = {};
        operation.params['page_id'] = me.page_id;
        operation.params['contest_id'] = me.contest_id;
    },
    
    
    startListening : function(){
        var me = this,
            selector = {};
        
        if( me.listening && me.last && me.last.page_id == me.page_id && me.last.contest_id == me.contest_id ) return;
        
        if( me.page_id ) selector.page_id = me.page_id;
        if( me.contest_id ) selector.contest_id = me.contest_id;
        
        if( !me.page_id && !me.contest_id ) selector = true;
        
        var reload = function(){
            console.log('reload', arguments);
            if( !me.bufferedLoadTimeout ) me.bufferedLoadTimeout = Ext.defer( function(){
                me.load();
                me.bufferedLoadTimeout = false;
            }, 500);
        };
        
        Bozuko.PubSub.subscribe('prize/redeemed', selector, reload);
        Bozuko.PubSub.subscribe('contest/win', selector, reload);
        Bozuko.PubSub.subscribe('contest/consolation', selector, reload);
        me.listening = true;
    }
});
