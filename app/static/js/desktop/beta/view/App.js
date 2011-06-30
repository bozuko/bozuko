Ext.define('Beta.view.App', {
    
    extend: 'Ext.panel.Panel',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            layout: 'border',
            items:[{
                ''
            }]
        });
        
        me.callParent(arguments);
    }
    
});