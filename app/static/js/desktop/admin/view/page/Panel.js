Ext.define('Bozuko.view.page.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.pagepanel',
    
    requires: ['Bozuko.view.page.Form', 'Bozuko.view.contest.Panel'],
    
    initComponent : function(){
        var me = this;
        
        me.layout = {
            type: 'hbox',
            align: 'stretch'
        };
        
        me.items = [{
            flex: 3,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            border: false,
            defaults: {
                frame: true
            },
            items: [{
                xtype: 'contestpanel',
                margin: '2 1 2 2',
                flex: 1,
                store: Ext.create('Bozuko.store.Contests', {
                    page_id: me.record.get('_id'),
                    autoLoad: true
                }),
                title: 'Campaigns'
            }]
        },{
            flex: 2,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            border: false,
            defaults: {
                frame: true
            },
            items: [{
                title: 'Page Details',
                xtype: 'pageform',
                margin: '2 2 1 1',
                flex: 3,
                data: me.record.data
            }, {
                margin: '1 2 2 1',
                flex: 4,
                title: 'Page Analytics'
            }]
        }];
        me.callParent();
    }
});