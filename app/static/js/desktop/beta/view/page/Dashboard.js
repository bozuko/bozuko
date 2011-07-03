Ext.define('Beta.view.page.Dashboard', {
    
    alias: 'widget.pagedashboard',
    extend: 'Ext.panel.Panel',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            layout          :'border',
            items: [{
                region          :'north',
                border          :false,
                autoHeight      :true
            },{
                region          :'center',
                html            :'graph'
            }]
        });
        
        me.callParent(arguments);
    }
    
});