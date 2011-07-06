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
                    
                    refs : [
                        {ref: 'appView', selector: 'betaapp'}
                    ],
                    
                    init : function(){
                        
                    },
                    
                    successStatus : function(text){
                        this.view.successStatus(text);
                    },
                    
                    failureStatus : function(text){
                        this.view.failureStatus(text);
                    },
                    
                    launch : function(){
                        
                        var me = this;
                        
                        me.titleNode = Ext.get( Ext.DomQuery.selectNode('.page-info h3') );
                        
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
                            renderTo: 'beta',
                            page: record
                        });
                        
                        record.on('save', function(){
                            me.titleNode.update( record.get('name') );
                        });
                        
                        this.offset = Ext.fly(hd).getHeight() + Ext.fly(copyright).getHeight() + 10;
                        this.setHeight();
                        Ext.EventManager.onWindowResize(this.setHeight, this);
                        
                        Ext.fly(copyright).down('.agreement').on('click', function(e, el){
                            e.stopEvent();
                            var win = new Ext.window.Window({
                                title: 'Beta Agreement',
                                width: 800,
                                height: 500,
                                bodyPadding: 10,
                                autoScroll: true,
                                bodyStyle: 'background: #fff',
                                modal: true,
                                html :'Loading...',
                                buttons: [{
                                    text: 'Close',
                                    handler: function(){
                                        win.close();
                                    }
                                }]
                            });
                            win.show();
                            Ext.Ajax.request({url: el.href, success: function(response){
                                win.update( response.responseText );
                            }});
                        });
                    },
                    
                    setHeight : function(){
                        var h = Ext.core.Element.getViewportHeight();
                        this.view.setHeight(Math.max(h-this.offset,300));
                        this.view.doLayout();
                    }
                    
                });
                
            }
        });
    });
});