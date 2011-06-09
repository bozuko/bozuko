Ext.define('Bozuko.store.Winners', {
    extend: 'Ext.data.Store',
    
    requires: [
        'Bozuko.model.Winner',
        'Ext.data.reader.Json'
    ],
    
    model: 'Bozuko.model.Winner',
    
    pollOnLoad : true,

    constructor : function(){
        var me = this;
        
        me.closeTries = 0;
        me.loaded = false;
        me.polling = false;
        me.callParent(arguments);
        me.on('beforeload', me.onBeforeLoad, me);
        me.on('load', me.onLoad, me);
        var reader = me.getProxy().getReader();
        var getResponseData = reader.getResponseData;
        reader.getResponseData = function(){
            var data = getResponseData.apply(this, arguments);
            if( data && data.last_updated ){
                me.last_updated = data.last_updated;
            }
            return data;
        }
    },
    
    onBeforeLoad : function(store, operation){
        var me = this;
        
        if( !me.page_id && !me.contest_id ) return;
        if( !operation.params ) operation.params = {};
        operation.params['page_id'] = me.page_id;
        operation.params['contest_id'] = me.contest_id;
    },
    
    onLoad : function(){
        var me = this;
        me.loaded = true;
        if( me.pollOnLoad ) me.startPolling();
        
    },
    
    startPolling : function(){
        var me = this;
        if( me.polling ) return false;
        if( !me.loaded ) return (me.pollOnLoad = true);
        me.polling = true;
        return me.poll();
    },
    
    poll : function(){
        var me = this;
        me.pollRequest = Ext.Ajax.request({
            url: '/admin/winners',
            method: 'post',
            timeout: 60000,
            jsonData: {
                contest_id: me.contest_id,
                page_id: me.page_id,
                last_updated: me.last_updated || null
            },
            callback : function(options, success, response){
                if( !me.fails ) me.fails = 0;
                if( success ){
                    me.fails = 0;
                    try{
                        var data = Ext.decode( response.responseText );
                        if( data && data.update && data.last_updated ){
                            console.log(me.last_updated, data.last_updated);
                            me.last_updated = data.last_updated;
                            me.load();
                        }
                    }catch(e){
                        // i don't kow what happened...
                    }
                }
                else{
                    me.fails++;
                }
                var last = me.pollRequest.timestamp;
                delete me.pollRequest;
                if( me.polling && me.fails < 4){
                    if( (new Date()).getTime() - last.getTime() < 100){
                        me.closeTries++;
                        if( me.closeTries > 3 ){
                            return;
                        }
                        me.poll();
                    }
                    else{
                        me.closeTries=0;
                        me.poll();
                    }
                }
            }
        });
        me.pollRequest.timestamp = new Date();
    },
    
    stopPolling : function(){
        var me = this;
        
        me.polling = false;
        if( me.pollRequest ) me.pollRequest.xhr.abort();
        delete me.pollRequest();
    }
});
