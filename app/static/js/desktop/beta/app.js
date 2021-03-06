Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');
Ext.Loader.setPath('Bozuko', '/js/desktop/Bozuko');

Ext.application({
        
    name: 'Beta',
    appFolder: '/js/desktop/beta',
    
    autoCreateViewport: false,

    controllers: [
        'Bozuko.controller.Pages',
        'Bozuko.controller.Contests'
    ],
    
    requires:[
        'Bozuko.lib.app.Controller',
        'Bozuko.lib.Overrides',
        'Bozuko.lib.Router',
        'Bozuko.view.page.Panel',
    ],
    
    refs : [
        {ref: 'appView', selector: 'pagepanel'}
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
        
        Bozuko.Router.setBasePath('/beta');
        Ext.Loader.require('Bozuko.model.Page', function(){
            Bozuko.model.Page.load( Bozuko.beta.page_id, {
                success: function(record){
                    me.record = record;
                    
                    // lets add a class to the html tag
                    Ext.getBody().addCls(record.get('is_enterprise')?'bozuko-enterprise':'bozuko-local');
                    var logo = Ext.DomQuery.selectNode('.hd h1.logo');
                    Ext.fly(logo).createChild({
                        tag: 'span',
                        cls: 'subtitle',
                        html: record.get('is_enterprise') ? 'Enterprise' : 'Local'
                    });
                    
                    me.titleNode = Ext.get( Ext.DomQuery.selectNode('.page-info h3') );
                    
                    if( Bozuko.beta.user_pages.length > 1 ){
                        var pi = Ext.DomQuery.selectNode('.user-profile');
                        
                        var menuItems = [];
                        Ext.Array.each( Bozuko.beta.user_pages, function(page){
                            if( page._id == Bozuko.beta.page_id ) return;
                            menuItems.push({
                                text            :page.name,
                                _id             :page._id,
                                icon            :page.image
                            });
                        });
                        
                        menuItems.push('-');
                        menuItems.push({
                            text            :'New Account',
                            _id             :'new-account',
                            icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-plus-16.png'
                        })
                        
                        var changeEl = Ext.fly(pi).createChild({
                            tag         :'span',
                            style       :'display: inline-block; margin-left: 10px; '
                        });
                        
                        Ext.create('Ext.button.Button', {
                            renderTo        :changeEl,
                            text            :'Change Account',
                            menuAlign       :'tr-br',
                            menu            :{
                                items           :menuItems,
                                listeners       :{
                                    click           :function(menu,item){
                                        
                                        if( item._id == 'new-account'){
                                            me.preventCloseWarning = true;
                                            window.location = '/beta/create-account';
                                            return;
                                        }
                                        
                                        me.preventCloseWarning = true;
                                        window.location = '/beta/page/'+item._id;
                                    },
                                    afterrender: function(component) {
                                        // Hide menu and then re-show so that alignment is correct.
                                        component.hide();
                                        component.show();
                                    }
                                }
                            }
                        });
                    }
                    
                    else {
                        var pi = Ext.DomQuery.selectNode('.user-profile');
                        
                        var changeEl = Ext.fly(pi).createChild({
                            tag         :'span',
                            style       :'display: inline-block; margin-left: 10px; '
                        });
                        
                        Ext.create('Ext.button.Button', {
                            renderTo        :changeEl,
                            text            :'New Account',
                            _id             :'new-account',
                            icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-plus-16.png',
                            handler         :function(){
                                me.preventCloseWarning = true;
                                window.location = '/beta/create-account';
                                return;
                            }
                        });
                    }
                    
                    Ext.fly('beta')
                        .removeCls('beta-loading')
                        .update('');
                    
                    var page = Ext.DomQuery.selectNode('.page'),
                        hd = Ext.DomQuery.selectNode('.hd'),
                        ft = Ext.DomQuery.selectNode('.ft'),
                        copyright = Ext.DomQuery.selectNode('.copyright')
                        ;
                        
                    Ext.fly(ft).remove();
                    
                    me.view = Ext.create('Bozuko.view.page.Panel', {
                        renderTo: 'beta',
                        page: record
                    });
                    Ext.fly( Ext.DomQuery.selectNode('.logo a') )
                        .on('click', function(e){
                            e.preventDefault();
                            var btn = me.view.down('button[group=page]');
                            me.controllers.getByKey('Bozuko.controller.Pages').changePage(btn);
                        });
                    ;
                    
                    record.on('save', function(){
                        me.titleNode.update( record.get('name') );
                    });
                    
                    me.offset = Ext.fly(hd).getHeight() + Ext.fly(copyright).getHeight() + 10;
                    me.setHeight();
                    Ext.EventManager.onWindowResize(me.setHeight, me);
                    
                    var logout = window.beta_logout;
                    window.beta_logout = function(link){
                        me.preventCloseWarning = true;
                        logout(link);
                    }
                    
                    // prevent unintentional leaving of the page
                    window.onbeforeunload = function(e){
                        if( !me.preventCloseWarning ){
                            var msg = 'If you leave this page, any unsaved worked will be lost.';
                            if( e ) e.returnValue = msg;
                            return msg;
                        }
                    };
                    
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
                }
            });
        });
    },
    
    setHeight : function(){
        var h = Ext.core.Element.getViewportHeight();
        this.view.setHeight(Math.max(h-this.offset,300));
        this.view.doLayout();
    }
    
});