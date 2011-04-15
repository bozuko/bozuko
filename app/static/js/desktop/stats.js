Ext4.onReady(function(){
    
    // lets build a panel
    var stores = {};
    // stores.city = Ext4.create('Ext')
    
    
    var panel = Ext4.widget('panel',{
        renderTo: 'charts',
        border: false,
        layout: {
            type: 'hbox',
            align: 'stretch'
        },
        height: 600,
        items: [{
            flex: 1,
            height: 600,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            xtype: 'container',
            
            items: [{
                height: 300,
                xtype: 'panel',
                title: 'Chart1'
            },
            {
                height: 300,
                xtype: 'panel',
                title: 'Chart2'
            }]
            
        },{
            flex: 1,
            height: 600,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            xtype: 'container',
            items: [{
                height: 300,
                xtype: 'panel',
                title: 'Chart1'
            },
            {
                height: 300,
                xtype: 'panel',
                title: 'Chart2'
            }]
            
        }]
    });
    
});