Ext.define('Beta.view.App', {
    
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.view.winners.List'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            height: 400,
            layout: 'border',
            border: false,
            items:[{
                region          :'east',
                title           :"Winners List - All Campaigns",
                xtype           :'winnerslist',
                width           :250,
                style           :'border-left-width: 1px; border-right-width: 1px;',
                border          :false
            },{
                region          :'center',
                html            :'hello',
                bodyPadding     :10,
                border          :false
            }]
        });
        
        me.callParent(arguments);
    }
    
});