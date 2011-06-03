Ext.define('Bozuko.view.admin.Dashboard' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.admindashboard',
    
    bodyPadding: 10,
    title:"Admin Dashboard",
    /*
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    */
    initComponent : function(){
        
        this.html = 'The admin dashboard';
        
        /*
         // okay.. lets add a chart.
        this.items = [{
            flex: 1,
            layout: {
                type: 'hbox',
                layout: 'stretch'
            },
            items: [{
                border: false,
                html: 'pretty big'
            },{
                margin: 4,
                frame: true,
                title: 'System',
                layout: 'fit',
                items: [{
                    xtype: 'profiler'
                }]
            }]
        },{
            flex: 2,
            border: false,
            html: 'big chart'
        }];
        */
        this.callParent();
    }
});