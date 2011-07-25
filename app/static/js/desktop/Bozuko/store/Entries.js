Ext.define('Bozuko.store.Entries', {
    extend: 'Ext.data.Store',
    
    requires: [
        'Bozuko.model.Entry',
        'Bozuko.lib.PubSub',
        'Ext.data.reader.Json'
    ],
    
    model: 'Bozuko.model.Entry',
    
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
        
        var reload = function(item, callback){
            me.updateStore();
            callback();
        };  
        
        Bozuko.PubSub.subscribe('contest/entry', selector, reload);
        me.on('destroy', function(){
            Bozuko.PubSub.unsubscribe('contest/entry', selector, reload);
        });
        me.listening = true;
    },
    
    updateStore : function(callback){
        var me = this;
        if( me.isLoading ){
            me.loadAgain = true;
            me.loadAgainCallback = callback;
            return;
        }
        me.isLoading = true;
        me.tmpStore.load({
            scope : me,
            callback : function(records){
                var j =0;
                if( me.loadAgain ){
                    me.updateStore(me.loadAgainCallback);
                    me.loadAgain = false;
                }
                if( callback ) callback();
                Ext.Array.each( records, function(record, i){
                    var r = me.getById( record.getId() );
                    if( r ){
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
