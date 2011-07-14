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
            layout : 'card',
            activeItem: 0,
            items : [{
                xtype           :'contestlist',
                store           :me.store,
                actionButtons   :['report'],
                autoScroll      :true
            }]    
        });
        
        me.callParent(arguments);
    }
});