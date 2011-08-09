Ext.define('Admin.controller.Admin' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    views: [
        'page.Panel',
        'page.Add',
        'Bozuko.view.page.Panel'
    ],
    
    stores: [
        'Bozuko.store.Places',
        'Bozuko.store.Users'
    ],
    
    models: [
        'Bozuko.model.Page',
        'Bozuko.model.User'
    ],
    
    refs : [
        {ref: 'pageData', selector: 'pagelist dataview'},
        {ref: 'pageSearch', selector: 'pagelist [ref=search]'},
        {ref: 'pageInactiveBtn', selector: 'pagelist [ref=inactive]'},
        {ref: 'pagePagingToolbar', selector: 'pagelist pagingtoolbar'},
        {ref: 'tabPanel', selector: 'viewport tabpanel'},
    ],
    
    getPagesStore : function(){
        return this.getPageData().store;
    },
    
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
            'pagelist [ref=search]':{
                change: Ext.Function.createBuffered( function(){
                    me.getPagesStore().load();
                }, 250)
            },
            'pagelist [ref=inactive]':{
                toggle : function(){
                    me.getPagesStore().load();
                }
            }
        });
    },
    
    onLaunch: function(){
        
        var me = this,
            store = this.getPagesStore(),
            pagingToolbar = this.getPagePagingToolbar(),
            dataview = this.getPageData();
            
        dataview.bindStore( store );
        pagingToolbar.bindStore( store );
        store.on('beforeload', me.onBeforeLoadPages, me);
        store.on('update', function(s, r){
            var id = r.get('_id');
        });
    },
    
    onBeforeLoadPages : function(store, operation){
        var me = this,
            searchField = me.getPageSearch(),
            search = searchField.getValue(),
            inactiveBtn = me.getPageInactiveBtn(),
            showInactive = inactiveBtn.pressed
            ;
        
        if( !operation.params ) operation.params = {};
        
        if( search ){
            operation.params['search'] = search;
        }
        if( showInactive ){
            operation.params['showInactive'] = true;
        }
        
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
                var place = form.place;
                
                Ext.Ajax.request({
                    url: '/admin/addpage',
                    params:{
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
            
        
        if( !me._tabs[id] ){
            var copy = record.copy();
            var panel = Ext.create('Bozuko.view.page.Panel', {
                page: copy,
                closable: true,
                title: record.get('name'),
                listeners: {
                    destroy: function(){
                        delete me._tabs[id];
                    }
                }
            });
            copy.on('save', me.onPageSave, me);
            me.getTabPanel().add( panel );
            me._tabs[id] = panel;
        }
        me.getTabPanel().setActiveTab( me._tabs[id] );
    },
    
    onPageSave: function(record){
        // also double check that we have this
        var me = this,
            id = record.get('_id'),
            r = me.getPagesStore().getById(id);
        if( r ){
            r.set( record.data );
            r.commit();
        }
        if( me._tabs && me._tabs[id] ){
            me._tabs[id].setTitle(record.get('name'));
        }
    },
    
    onContestItemClick : function(view, record, item, index, e){
        // get the target
        var target = e.getTarget();
        if( target.tagName.toLowerCase() != 'a' ) return;
        switch( target.className ){
            case 'edit':
                this.editContest(record, view);
                e.stopEvent();
                break;
            
            case 'delete':
                Ext.Msg.confirm(
                    'Are you sure?',
                    'Are you sure you want to delete this campaign?',
                    function(btn){
                        if( btn != 'ok' && btn != 'yes' ) return;
                        // delete it, they said so
                        record.store.remove(record);
                        record.destroy({
                            callback : function(){
                                // console.log('the campaign was destroyed');
                            }
                        });
                    }
                );
                e.stopEvent();
                break;

            case 'publish':
                var url = '/admin/contests/'+record.getId()+'/publish';
                Ext.Msg.confirm(
                    'Are you sure?',
                    'Are you sure you want to publish this campaign?',
                    function(btn){
                        if( btn != 'ok' && btn != 'yes' ) return;
                        var cp = view.up('contestpanel');
                        cp.setLoading("Publishing... This may take a minute, please be patient");
                        Ext.Ajax.request({
                            url: url,
                            timeout : 1000 * 60 * 5,
                            method: 'post',
                            callback : function(opts, success, response){
                                cp.setLoading(false);
                                if( !success ){
                                    // alert?
                                    alert('Publish request was unreadable');
                                    return;
                                }
                                try{
                                    var result = Ext.decode( response.responseText );
                                    if( result && result.success){
                                        // need to refresh the contests..
                                        view.store.load();
                                    }
                                }catch(e){
        
                                }
                            }
                        });
                    }
                );
                e.stopEvent();
                break;

            case 'copy':

                var name = record.get('name');
                if( name ) name+=' (Copy)';
                else name = Ext.Date.parse(new Date(), 'Campaign m-d-Y');
                Ext.Msg.prompt({
                    title: 'Copy Campaign',
                    msg: 'What would you like to name your new campaign?',
                    fn: function(btn, text){
                        if( btn !== 'ok') return;
                        var copy = record.copy();
                        copy.phantom=true;

                        // initialize the stores and delete the ids
                        var prizes = copy.prizes();
                        var consolations = copy.consolation_prizes();

                        record.prizes().each(function(prize){
                            var c = prize.copy();
                            c.set('_id','');
                            c.set('won', 0);
                            c.set('redeemed', 0);
                            prizes.add(c);
                        });

                        record.consolation_prizes().each(function(prize){
                            var c = prize.copy();
                            c.set('_id','');
                            c.set('won', 0);
                            c.set('redeemed', 0);
                            consolations.add(c);
                        });

                        var now = new Date();
                            diff = copy.get('end').getTime() - copy.get('start').getTime(),
                            start = now,
                            end = new Date();

                        copy.set('_id', '');
                        end.setTime(start.getTime() + diff);
                        copy.set('start', start);
                        copy.set('end', end);
                        copy.set('name', text);
                        copy.set('active', false);
                        copy.set('total_entries', 0);
                        copy.set('total_plays', 0);
                        copy.set('play_cursor', -1);
                        copy.set('token_cursor', 0);
                        copy.phantom = true;
                        // save the copy
                        copy.save({
                            callback : function(){
                                view.store.load();
                            }
                        });
                    },
                    icon: Ext.Msg.INFO,
                    prompt: true,
                    width: 300,
                    buttons: Ext.Msg.OKCANCEL,
                    value: name,
                    modal: true
                });
                e.stopEvent();
                break;

            case 'cancel':

                var url = '/admin/contests/'+record.getId()+'/cancel';
                 Ext.Msg.confirm(
                    'Are you sure?',
                    'Are you sure you want to delete this campaign?',
                    function(btn){
                        if( btn != 'ok' && btn != 'yes' ) return;
                        Ext.Ajax.request({
                            url: url,
                            method: 'post',
                            callback : function(opts, success, response){
                                if( !success ){
                                    // alert?
                                    return;
                                }
                                try{
                                    var result = Ext.decode( response.responseText );
                                    if( result && result.success){
                                        // need to refresh the contests..
                                        view.store.load();
                                    }
                                }catch(e){
        
                                }
                            }
                        });
                    }
                );
                e.stopEvent();
                break;

            default:
                break;
        }
    }
});