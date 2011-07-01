Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');
Ext.Loader.setPath('Bozuko', '/js/desktop/Bozuko');

Ext.application({
    
    name: 'Beta',
    appFolder: '/js/desktop/beta',
    
    autoCreateViewport: false,

    controllers: [
        
    ],
    
    requires:[
        'Beta.view.App',
        'Bozuko.lib.Router'
    ],
    
    launch : function(){
        
        Bozuko.Router.setBasePath('/beta');
        
        Ext.fly('beta')
            .removeCls('beta-loading')
            .update('');
        
        this.view = new Beta.view.App({
            renderTo: 'beta'
        });
    }
    
});