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
                xtype           :'winnerslist',
                width           :250,
                border          :false
            },{
                region          :'center',
                html            :'hello',
                bodyPadding     :10
            }]
        });
        
        me.callParent(arguments);
    }
    
});