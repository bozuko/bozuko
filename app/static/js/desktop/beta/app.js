Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');
Ext.Loader.setPath('Bozuko', '/js/desktop/Bozuko');

Ext.Loader.require('Bozuko.lib.Router', function(){
    Bozuko.Router.setBasePath('/beta');
    Ext.Loader.require('Bozuko.model.Page', function(){
        Bozuko.model.Page.load( Bozuko.beta.page_id, {
            success: function(record){
                
                Ext.application({
        
                    name: 'Beta',
                    page: record,
                    appFolder: '/js/desktop/beta',
                    
                    autoCreateViewport: false,
                
                    controllers: [
                        'Pages'
                    ],
                    
                    requires:[
                        'Beta.view.App'
                    ],
                    
                    init : function(){
                        
                    },
                    
                    launch : function(){
                        
                        var me = this;
                        
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
                        this.view.setHeight(Math.max(h-this.offset,300));
                    }
                    
                });
                
            }
        });
    });
});