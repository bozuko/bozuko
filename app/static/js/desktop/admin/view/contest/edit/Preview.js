Ext.define('Admin.view.contest.edit.Preview', {
    
    extend: 'Ext.panel.Panel',
    alias: 'widget.contestformpreview',
    
    requires: [
        'Bozuko.model.Contest'
    ],
    
    cls: 'campaign-preview',
    width: 200,
    bodyPadding: 10,
    border: false,
    autoScroll: true,
    title: 'Campaign Preview',
    html: 'Test',
    
    initComponent : function(){
        var me = this;
        
        me.callParent(arguments);
    }
    
});