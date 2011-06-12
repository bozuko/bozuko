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
            
        if( me.page_id ) selector.page_id = me.page_id;
        if( me.contest_id ) selector.contest_id = me.contest_id;
        
        var reload = function(){
            me.load();
        };
        
        Bozuko.PubSub.subscribe('prize/redeemed', selector, reload)
        Bozuko.PubSub.subscribe('contest/win', selector, reload)
        Bozuko.PubSub.subscribe('contest/consolation', selector, reload)
    }
});
