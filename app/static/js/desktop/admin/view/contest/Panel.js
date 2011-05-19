Ext.define('Bozuko.view.contest.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestpanel',
    
    requires: ['Bozuko.view.contest.View'],
    autoScroll: true,
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'contestsview',
            store           :me.store
        }];
        me.callParent();
    }
});