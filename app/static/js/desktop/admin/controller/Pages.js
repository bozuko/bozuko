Ext.define('Admin.controller.Pages' ,{
    extend: 'Bozuko.app.Controller',
    
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
            this.initPagePanel( panel, record );
        }
        me.getTabPanel().setActiveTab( me._tabs[id] );
    },
    
    initPagePanel : function( panel, record ){
        var form = panel.down('pageform'),
            saveBtn = form.down('button[action=save]');
            
        form.loadRecord( record );
        saveBtn.on('click', function(){
            this.savePage(form);
        }, this);
        
    },
    
    getValues : function(form, selector){
        var values = {};
        selector = selector ? selector+' field' : 'field';
        Ext.Array.each(form.query( selector ), function(field){
            var ns = field.getName().split('.'), cur = values;
            
            if( ns.length > 1 ) while( ns.length > 1 ){
                var p = ns.shift();
                if( !cur[p]) cur[p] = {};
                cur = cur[p];
            }
            
            cur[ns.shift()] = field.getValue();
        });
        return values;
    },
    
    savePage : function( form ){
        var me = this;
        // update the record...
        var saveBtn = form.down('button[action=save]');
        var values = this.getValues(form);
        /*
        Ext.Object.each( values, function(key, value){
            var parts = key.split('.');
            if( parts.length == 1 ) return;
            var cur = values;
            while( parts.length > 1 ){
                var part = parts.shift();
                if( !cur[part] ) cur[part] = {};
                cur = cur[part];
            }
            cur[parts.shift()] = value;
        });
        */
        form.record.set(values);
        form.record.commit();
        saveBtn.disable();
        form.record.save({
            success: function(){
                // also double check that we have this
                var r = me.getPagesStore().getById(form.record.getId());
                if( r ){
                    r.set( form.record.data );
                    r.commit();
                }
                saveBtn.enable();
            },
            failure: function(){
                alert('Error Saving Page');
                saveBtn.enable();
            }
        });
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