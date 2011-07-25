Ext.define('Admin.controller.Pages' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    views: [
        'page.Panel',
        'page.Add'
    ],
    stores: [
        'Bozuko.store.Pages',
        'Bozuko.store.Places',
        'Bozuko.store.Users'
    ],
    
    models: [
        'Bozuko.model.Page',
        'Bozuko.model.User'
    ],
    
    refs : [
        {ref: 'pageData', selector: 'pagelist dataview'},
        {ref: 'tabPanel', selector: 'viewport tabpanel'},
    ],
    
    init : function(){
        var me = this;
        this._tabs = {};
        this.control({
            'pagelist dataview':{
                itemclick: this.onPageClick
            },
            'pagelist button[action=add]':{
                click: this.addPage
            },
            'pagelist button[action=reload]':{
                click: function(){
                    me.getPagesStore().load();
                }
            },
            'pagepanel [ref=page-navbar] button':{
                click: this.changePage
            }
        });
    },
    
    onLaunch: function(){
        
        var me = this,
            store = this.getPagesStore(),
            dataview = this.getPageData();
            
        dataview.bindStore( store );
        store.on('update', function(s, r){
            var id = r.get('_id');
            if( me._tabs && me._tabs[id] ){
                me._tabs[id].setTitle(r.get('name'));
            }
        });
    },
    
    addPage : function(){
        // open the add window
        var me = this;
        if( !this._addWindow ){
            this._addWindow = Ext.create( 'Admin.view.page.Add', {
                title: 'Add a Business Page',
                width: 800,
                height: 600,
                placesStore: me.getPlacesStore(),
                pagesStore: Ext.create('Bozuko.store.Places'),
                usersStore: Ext.create('Bozuko.store.Users'),
                listeners: {
                    close : function(){
                        delete me._addWindow;
                    },
                    latlngchange : function(center){
                        me.getPlacesStore().load({
                            params:{
                                ll: center.lat()+','+center.lng()
                            }
                        });
                    }
                }
            });
            me._addWindow.down('button[action=add]').on('click', function(){
                
                var form = me._addWindow.down('pageaddform');
                var user = form.user;
                var place = form.place;
                
                Ext.Ajax.request({
                    url: '/admin/addpage',
                    params:{
                        user_id: user.get('_id'),
                        place_id: place.get('id')
                    },
                    method: 'post',
                    success: function(){
                        me.getPagesStore().load();
                        me._addWindow.close();
                    }
                });
            }, me);
        }
        this._addWindow.show();
    },
    
    onPageClick : function(view, record){
        // need to open a new tab with the business page
        var id = record.get('_id'),
            me = this;
            
        if( !this._tabs[id] ){
            var copy = record.copy();
            var panel = Ext.create('Admin.view.page.Panel', {
                record: copy,
                closable: true,
                page_id: id,
                title: record.get('name'),
                listeners: {
                    destroy: function(){
                        delete me._tabs[id];
                    }
                }
            });
            me.getTabPanel().add( panel );
            me._tabs[id] = panel;
            copy.on('save', me.onSavePage, me);
        }
        me.getTabPanel().setActiveTab( me._tabs[id] );
    },
    
    onSavePage : function( record ){
        console.log('on save page');
        var me = this,
            r = me.getPagesStore().getById(record.getId());
            
        if( r ){
            r.set( record.data );
            r.commit();
        }
    },
    
    changePage : function( btn ){
        var toolbar = btn.up('toolbar'),
            pagePanel = toolbar.up('pagepanel');
            
        toolbar.items.each(function(cmp){
            if( cmp.xtype == 'button' && cmp.pressed ) cmp.toggle();
        });
        if( !btn.pressed ) btn.toggle();
        var page = btn.page;
        switch( page ){
            case 'settings':
                pagePanel.getLayout().setActiveItem( pagePanel.down('pageform') );
                break;
            case 'campaigns':
                pagePanel.getLayout().setActiveItem( pagePanel.down('contestpanel') );
                break;
        }
    }
});