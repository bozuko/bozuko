Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');
Ext.Loader.setPath('Bozuko', '/js/desktop/Bozuko');
Ext.application({
    
    name: 'Browser',
    appFolder: '/js/desktop/admin',
    
    autoCreateViewport: false,
    
    controllers: ['Browser'],
    views: ['Browser'],
    
    
    launch: function() {
        this.viewport = Ext.create('Ext.container.Viewport',{
            layout:'fit',
            items:[{
                xtype: 'apibrowser'
            }]
        });
    }
});