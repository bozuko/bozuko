Ext.define('Admin.controller.Admin' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    views: [
        'page.Add',
        'page.Admin',
        'Bozuko.view.page.Panel'
    ],
    
    stores: [
        'Bozuko.store.Places',
        'ApiKeys'
    ],
    
    models: [
        'Bozuko.model.Page',
        'Bozuko.model.User',
        'ApiKey'
    ],
    
    refs : [
        {ref: 'pageData', selector: 'pagelist dataview'},
        {ref: 'userData', selector: 'userlist dataview'},
        {ref: 'apiKeyGrid', selector: '[ref=apikeygrid]'},
        {ref: 'apiKeyDelBtn', selector: '[ref=apikeygrid] [ref=delbtn]'},
        {ref: 'pageSearch', selector: 'pagelist [ref=search]'},
        {ref: 'userSearch', selector: 'userlist [ref=search]'},
        {ref: 'userFilter', selector: 'userlist [ref=filter]'},
        {ref: 'pageInactiveBtn', selector: 'pagelist [ref=inactive]'},
        {ref: 'pagePagingToolbar', selector: 'pagelist pagingtoolbar'},
        {ref: 'tabPanel', selector: 'viewport tabpanel[region=center]'}
    ],
    
    getPagesStore : function(){
        return this.getPageData().store;
    },
    
    getUsersStore : function(){
        return this.getUserData().store;
    },
    
    init : function(){
        var me = this;
        this._tabs = {};
        
        me.BozukoPagesController = me.application.controllers.getByKey('Bozuko.controller.Pages');
        
        this.control({
            '[ref=apikeygrid]': {
                render: this.onApiKeyGridRender,
                edit:   this.onApiKeyEdit,
                canceledit :this.onApiKeyCancelEdit,
                selectionchange : this.onApiKeySelectionChange
            },
            '[ref=apikeygrid] [ref=addbtn]': {
                click: this.addApiKeyRow
            },
            '[ref=apikeygrid] [ref=delbtn]': {
                click: this.delApiKeyRow
            },
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
            'userlist dataview' : {
                itemcontextmenu: this.onUserContextMenu
            },
            'userlist [ref=search]':{
                change: Ext.Function.createBuffered( function(){
                    me.getUsersStore().load();
                }, 250)
            },
            'userlist [ref=filter]':{
                change: function(){
                    me.getUsersStore().load();
                }
            },
            'pagelist [ref=inactive]':{
                toggle : function(){
                    me.getPagesStore().load();
                }
            },
            'pagepanel' : {
                render: me.onPagePanelRender
            },
            'pageadmin [action=save]' : {
                click : function(btn){
                    me.BozukoPagesController.saveSettings(btn);
                }
            },
            'contestspanel' : {
                render : me.onContestPanelRender
            },
            'bozukochartbasic': {
                render : me.onChartRender
            }
        });
    },
    
    addApiKeyRow : function(){
        var grid = this.getApiKeyGrid(),
            rowEdit = grid.getPlugin('rowedit');
            
        rowEdit.cancelEdit();
        
        // Create a model instance
        var r = Ext.create('Admin.model.ApiKey', {
            timestamp: new Date(),
            key: this.createKey(32),
            secret: this.createKey(32)
        });

        grid.getStore().insert(0, r);
        rowEdit.startEdit(0, 0);
        
    },
    
    createKey : function(len){
        var key=''
          , pool = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
          ;
        for(var i=0; i<len; i++){
            key += pool.charAt(Math.random()*pool.length);
        }
        return key;
    },
    
    onApiKeySelectionChange : function(selModel, records){
        this.getApiKeyDelBtn().setDisabled(!records.length);
    },
    
    onApiKeyEdit : function(editor){
        editor.record.save();
    },
    
    onApiKeyCancelEdit : function(editor){
        if(editor.record.phantom){
            this.getApiKeyGrid().getStore().remove(editor.record);
        }
    },
    
    delApiKeyRow : function(){
        if(!confirm('Are you sure you want to delete this key?')) return;
        var r = this.getApiKeyGrid().getSelectionModel().getSelection();
        if(r.length) for(var i=0; i<r.length; i++){
            r[i].destroy();
            this.getApiKeyGrid().getStore().remove(r[i]);
        }
    },
    
    onLaunch: function(){
        
        var me = this,
            store = this.getPagesStore(),
            userStore = this.getUsersStore(),
            pagingToolbar = this.getPagePagingToolbar(),
            dataview = this.getPageData();
            
        dataview.bindStore( store );
        pagingToolbar.bindStore( store );
        store.on('beforeload', me.onBeforeLoadPages, me);
        userStore.on('beforeload', me.onBeforeLoadUsers, me);
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
        
        if( search != this.lastSearch || showInactive != this.showInactive ){
            operation.start = 0;
            operation.page = 1;
            store.currentPage = 1;
        }
        
        this.lastSearch = search;
        this.showInactive = showInactive;
        
    },
    
    onApiKeyGridRender : function(){
        this.getApiKeyGrid().bindStore( this.getApiKeysStore() );
        this.getApiKeyGrid().down('pagingtoolbar').bindStore( this.getApiKeysStore() );
        this.getApiKeysStore().load();
        
    },
    
    onBeforeLoadUsers : function(store, operation){
        var me = this,
            searchField = me.getUserSearch(),
            search = searchField.getValue(),
            filterField = me.getUserFilter()
            ;
        
        var filter = filterField.getActiveItem().value;
            
        if( !operation.params ) operation.params = {};
        
        operation.params.user_filter = filter;
        
        if( search ){
            operation.params['search'] = search;
        }
        if( search != this.lastUserSearch || filter != this.lastUserFilter ){
            operation.start = 0;
            operation.page = 1;
            store.currentPage = 1;
        }
        
        this.lastUserFilter = filter;
        this.lastUserSearch = search;
        
    },
    
    onPagePanelRender : function(panel){
        var me = this,
            nav = panel.down('toolbar[ref=navigation]'),
            pages = panel.down('[ref=pages]'),
            lastBtn = nav.down('button[page=resources]')
            ;
            
        var i = nav.items.indexOf( lastBtn );
        nav.insert(i+1, {
            text        :'Admin',
            page        :'admin',
            group       :'page',
            icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/lightening-24.png'
        });
        
        pages.add({
            ref             :'admin',
            xtype           :'pageadmin',
            border          :false,
            page            :panel.page
        });
    },
    
    onUserContextMenu : function(view, record, item, index, event){
        var me = this;
        event.preventDefault();
        if( !me.userMenu ){
            me.menu = Ext.create('Ext.menu.Menu', {
                items: [{
                    text: 'Block',
                    ref:'block',
                    icon: "/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-cross-16.png",
                    handler: me.blockUser,
                    scope: me
                },{
                    text: 'Allow',
                    ref:'allow',
                    icon: "/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-check-16.png",
                    handler: me.allowUser,
                    scope: me
                },{
                    text: 'Download Friends as CSV',
                    ref:'download',
                    icon: "/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-down-16.png",
                    handler: me.downloadUserStats,
                    scope: me
                }]
            });
        }
        me.menu.setTitle(record.get('name'));
        me.contextUser = record;
        if( record.get('blocked') ){
            me.menu.down('[ref=allow]').show();
            me.menu.down('[ref=block]').hide();
        }
        else{
            me.menu.down('[ref=block]').show();
            me.menu.down('[ref=allow]').hide();
        }
        me.menu.showAt(event.getXY());
    },
    
    onContestPanelRender : function(panel){
        var me = this,
            tbar = panel.down('[ref=contestreport-navbar]');
        
        // add an import button
        tbar.add('-', {
            xtype: 'filefield',
            buttonOnly: true,
            autoWidth: true,
            hideLabel: true,
            buttonConfig : {
                ui: 'default-toolbar',
                scale : 'medium',
                text : 'Import',
                icon: "/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-direction-up-24.png"
            },
            listeners : {
                change : function(field){
                    // if this is not .json lets crap out
                    var files = field.fileInputEl.dom.files;
                    if( !files || !files[0] ) return;
                    var file = files[0];
                    if( !/\.json/i.test( file.name )) return;
                    var reader = new FileReader();
                    reader.onload = function(e){
                        try{
                            var data = Ext.decode(e.target.result);
                            if( data ){
                                delete data._id;
                                delete data.page_id;
                                data.state = 'draft';
                                data.active = false;
                                
                                // go through
                                try{
                                    Ext.Array.each( data.prizes, function(prize, i){
                                        delete data.prizes[i]._id;
                                        delete data.prizes[i].won;
                                        delete data.prizes[i].redeemed;
                                    });
                                    Ext.Array.each( data.consolation_prizes, function(prize, i){
                                        delete data.consolation_prizes[i]._id;
                                        delete data.consolation_prizes[i].won;
                                        delete data.consolation_prizes[i].redeemed;
                                    });
                                }catch(e){}
                                
                                var record = panel
                                    .store
                                    .getProxy()
                                    .getReader()
                                    .readRecords({items:[data], total:1})
                                    .records[0]
                                    ;
                                panel.store.add(record);
                                me.application.controllers.getByKey('Bozuko.controller.Contests')
                                    .editContest(record, field)
                                    ;
                            }
                            
                        }catch(er){
                            console.log(er);
                        }
                    };
                    reader.readAsText( file );
                    
                },
                render : function(field){
                    field.fileInputEl.dom.setAttribute('accept','application/json');
                }
            }
        });
    },
    
    blockUser : function(){
        var me = this;
        
        if( !me.contextUser ) return;
        var url = '/admin/users/'+me.contextUser.get('_id')+'/block';
        Ext.Ajax.request({
            url: url,
            method: 'post',
            success: function( response ){
                me.getUsersStore().load();
            }
        });
    },
    
    allowUser : function(){
        var me = this;
        
        if( !me.contextUser ) return;
        var url = '/admin/users/'+me.contextUser.get('_id')+'/block';
        Ext.Ajax.request({
            url: url,
            method: 'DELETE',
            success: function( response ){
                me.getUsersStore().load();
            }
        });
    },
    
    downloadUserStats : function(){
        window.open(
            Bozuko.Router.route('/users/'+this.contextUser.get('_id')+'/friends.csv')
        );
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
    
    onChartRender : function(chart){
        chart.add({
            xtype           :'panel',
            border          :false,
            style           :'text-align:center; padding-top: 10px; ',
            anchor          :'0',
            autoHeight      :true,
            items           :[{
                autoHeight      :true,
                xtype           :'button',
                hidden          : chart.contest_id ? false : true,
                text            :'Download Admin Report',
                href            : Bozuko.Router.route('/contests/'+chart.contest_id+'/adminReport')
            }]
        })
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