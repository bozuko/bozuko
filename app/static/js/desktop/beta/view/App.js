Ext.define('Beta.view.App', {
    
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.view.winners.List',
        'Beta.view.page.Dashboard'
    ],
    
    cls: 'beta-panel',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            height: 400,
            layout: 'border',
            border: false,
            items:[{
                region          :'east',
                collapsible     :true,
                frame           :false,
                title           :"Winners List - All Campaigns",
                xtype           :'winnerslist',
                width           :250,
                border          :false
            },{
                region          :'center',
                xtype           :'pagedashboard',
                border          :false
            }]
        });
        
        me.callParent(arguments);
    }
    
});