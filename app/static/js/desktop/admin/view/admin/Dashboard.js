Ext.define('Admin.view.admin.Dashboard' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.admindashboard',
    
    bodyPadding: 0,
    title:"Admin Dashboard",
    
    layout: {
        type: 'border'
    },
    
    requires: [
        'Bozuko.lib.PubSub',
        'Bozuko.store.Reports',
        'Bozuko.view.chart.Basic',
        'Bozuko.view.contest.Players'
    ],
    
    initComponent : function(){
        var me = this;
        
        this.items = [{
            region: 'center',
            layout: 'border',
            ref: 'admindashboard',
            border: false,
            items:[{
                region : 'center',
                border : false,
                xtype: 'tabpanel',
                tabPosition: 'bottom',
                items:[{
                    layout : 'anchor',
                    bodyPadding: 10,
                    autoScroll: true,
                    border: false,
                    title: 'Stats',
                    items : [{
                        xtype : 'bozukochartbasic',
                        border : false,
                        anchor : '0'
                    }]
                },{
                    xtype: 'grid',
                    ref: 'apikeygrid',
                    border: false,
                    autoScroll: true,
                    title: 'API Keys',
                    selType: 'rowmodel',
                    tbar:[{
                        text: 'Add Key',
                        ref:'addbtn'
                    },{
                        text: 'Delete Key',
                        ref:'delbtn',
                        disabled: true
                    }],
                    bbar: Ext.create('Ext.PagingToolbar', {
                        displayInfo: true,
                        displayMsg: 'Displaying keys {0} - {1} of {2}',
                        emptyMsg: "No keys to display"
                    }),
                    columns: [
                        {header: 'Date', dataIndex: 'timestamp', width: 80, format: 'm/d/Y', xtype: 'datecolumn'},
                        {header: 'Key', dataIndex: 'key', width: 220},
                        {header: 'Secret', dataIndex: 'secret', width: 220},
                        {header: 'Name',  dataIndex: 'name', editor: {xtype: 'textfield', allowBlank:false}, width: 180},
                        {header: 'Description', dataIndex: 'description', flex:1, editor: 'textfield'}
                    ],
                    plugins: [
                        Ext.create('Ext.grid.plugin.RowEditing', {
                            clicksToEdit: 2,
                            autoCancel:true,
                            pluginId:'rowedit'
                        })
                    ]
                }]
            },{
                height: 200,
                split: true,
                border: '1 0 0 0',
                title: 'Event Log',
                region: 'south',
                autoScroll: true,
                collapsible: true,
                ref:'event-grid',
                xtype: 'grid',
                store: Ext.create('Ext.data.Store',{
                    id: 'eventStore',
                    fields:['type','message','timestamp','_id'],
                    data:{'items':[]},
                    sorters: [{property:'timestamp', direction: 'DESC'}],
                    proxy:{
                        type: 'memory',
                        reader: {
                            type: 'json',
                            root: 'items'
                        }
                    }
                }),
                columns: [
                    {header: 'Timestamp', dataIndex: 'timestamp', width: 150},
                    {header: 'Event', dataIndex: 'type', width: 150},
                    {header: 'Message', dataIndex: 'message', renderer: JSON.stringify, flex: 1}
                ],
                listeners : {
                    itemdblclick : function(view, record, item, index, event ){
                        var me = this,
                            id = record.get('_id'),
                            win;
                        if( !this.windows ) this.windows = {};
                        if( !(win = this.windows[id]) ){
                            win = Ext.create('Ext.window.Window', {
                                width: 600,
                                height: 400,
                                bodyStyle: 'background: #020202; color: #fff',
                                autoScroll: true,
                                title: record.get('type')+' @ '+record.get('timestamp'),
                                html: '<pre>'+JSON.stringify( record.get('message'), null, '  ')+'</pre>',
                                bodyPadding: 10,
                                listeners:{
                                    close : function(){
                                        delete me.windows[id];
                                    }
                                }
                            });
                            me.windows[id] = win;
                        }
                        win.show();
                    }
                }
            }]
        },{
            region: 'east',
            width: 250,
            split: true,
            border: true,
            margin: '2 2 2 0',
            xtype: 'contestplayers'
        }];
        
        me.callParent();
        me.queuedItems = [];
        
        
        var eventLog = Ext.data.StoreManager.lookup('eventStore');
        
        me.on('activate', function(){
            me.on('activate', function(){
                
                if( me.queuedItems.length ) me.addEventToLog( me.queuedItems );
                me.queuedItems = [];
            });
        });
        
        Bozuko.PubSub.subscribe('*', true, function(item, callback){
            callback();
            if( !me.isVisible() ){
                me.queuedItems.push( eventLog.createModel(item) );
                return;
            }
            me.addEventToLog( [eventLog.createModel(item)] );
        });
    },
    
    addEventToLog : function(records){
        var eventLog = Ext.data.StoreManager.lookup('eventStore');
        try{
            eventLog.insert(0,records);
            while(eventLog.getCount() > 150 ){
                eventLog.removeAt(150);
            }
        }catch(e){
            console.log(e.stack);
        }
    }
});