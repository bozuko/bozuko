Ext.regController("App", {
    
    launch : function(){
        var me = this;
        
        this.viewport = this.render({
            xtype: 'app-viewport'
        });
        
        var cb = function(){
            me.viewport.down('app-winners-list').store.load();
        };
        
        Bozuko.PubSub.subscribe('contest/win', true, cb);
        Bozuko.PubSub.subscribe('prize/redeemed', true, cb);
    }
    
});