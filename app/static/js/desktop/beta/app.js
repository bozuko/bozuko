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
            
        var page = Ext.DomQuery.selectNode('.page'),
            hd = Ext.DomQuery.selectNode('.hd'),
            ft = Ext.DomQuery.selectNode('.ft'),
            copyright = Ext.DomQuery.selectNode('.copyright')
            ;
            
        Ext.fly(ft).remove();
        this.view = new Beta.view.App({
            renderTo: 'beta'
        });
        this.offset = Ext.fly(hd).getHeight() + Ext.fly(copyright).getHeight() + 20;
        this.setHeight();
        Ext.EventManager.onWindowResize(this.setHeight, this);
    },
    
    setHeight : function(){
        var h = Ext.core.Element.getViewportHeight();
        this.view.setHeight(h-this.offset);
    }
    
});