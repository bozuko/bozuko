Ext.define('Bozuko.store.Winners', {
    extend: 'Ext.data.Store',
    
    requires: [
        'Bozuko.model.Winner',
        'Bozuko.lib.PubSub',
        'Ext.data.reader.Json'
    ],
    
    model: 'Bozuko.model.Winner',
    
    isListener : true,

    constructor : function(){
        
        var me = this;
        
        me.last = {};
        me.listening = false;
        
        me.callParent(arguments);
        me.on('beforeload', me.onBeforeLoad, me);
        if( me.isListener ){
            me.startListening();
            me.tmpStore = me.self.create({
                page_id : me.page_id,
                contest_id : me.contest_id,
                isListener : false,
                parent: me,
                autoLoad: false
            });
        }
        
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
            if( !me.bufferedLoadTimeout ) me.bufferedLoadTimeout = Ext.defer( function(){
                me.updateStore();
                me.bufferedLoadTimeout = false;
            }, 500);
        };  
        
        Bozuko.PubSub.subscribe('prize/redeemed', selector, reload);
        Bozuko.PubSub.subscribe('contest/win', selector, reload);
        Bozuko.PubSub.subscribe('contest/consolation', selector, reload);
        me.listening = true;
    },
    
    updateStore : function(){
        var me = this;
        me.tmpStore.load({
            scope : me,
            callback : function(records){
                var j =0;
                Ext.Array.each( records, function(record, i){
                    var r = me.getById( record.getId() );
                    if( r ){
                        var index = me.indexOf(r);
                        if( index !== i ){
                            // move it into position
                            me.removeAt(index);
                            me.insert( i, r );
                        }
                        r.set( record.data );
                        r.commit();
                    }
                    else{
                        me.insert(j++, record);
                    }
                });
                while( me.getCount() > 100 ) me.removeAt(100);
            }
        });
    }
});
