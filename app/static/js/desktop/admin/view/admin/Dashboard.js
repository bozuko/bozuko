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
                layout : 'anchor',
                bodyPadding: 10,
                autoScroll: true,
                items : [{
                    xtype : 'bozukochartbasic',
                    border : false,
                    anchor : '0'
                }]
            },{
                height: 200,
                split: true,
                border: '1 0 0 0',
                title: 'Event Log',
                region: 'south',
                autoScroll: true,
                collapsible: true,
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
        this.callParent();
        var eventLog = Ext.data.StoreManager.lookup('eventStore');
        Bozuko.PubSub.subscribe('*', true, function(message, type, timestamp, _id){
            var time = new Date();
            time.setTime( Date.parse(timestamp) );
            var record = eventLog.createModel({type:type,message: message, timestamp: time, _id: _id});
            eventLog.insert(0,[record]);
            while(eventLog.getCount() > 150 ){
                eventLog.removeAt(150);
            }
        });
    }
});