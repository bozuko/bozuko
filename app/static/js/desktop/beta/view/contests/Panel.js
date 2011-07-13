Ext.define('Beta.view.contests.Panel', {
    
    alias: 'widget.contestspanel',
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.lib.PubSub',
        'Bozuko.view.contest.List'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            bodyCls: 'contestpanel',
            items : [{
                xtype       :'contestlist',
                store       :me.store,
                autoScroll  :true
            }]    
        });
        
        me.callParent(arguments);
    }
});