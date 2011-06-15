Bozuko.views.Viewport = Ext.extend(Ext.Panel, {
    
    fullscreen: true,
    layout: 'card',
    activeItem: 0,
    
    initComponent: function() {
        
        Ext.apply( this, {
            dockedItems:[{
                dock: 'top',
                xtype: 'toolbar',
                title: 'All Winners List'
            }],
            items: [{
                xtype: 'app-winners-list'
            }]
        });
        
        Bozuko.views.Viewport.superclass.initComponent.apply(this, arguments);
    }
});

Ext.reg('app-viewport', Bozuko.views.Viewport);