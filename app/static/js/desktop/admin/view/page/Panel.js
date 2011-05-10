Ext.define('Bozuko.view.page.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.pagepanel',
    
    requires: ['Bozuko.view.page.Form'],
    
    initComponent : function(){
        var me = this;
        this.layout = {
            type: 'vbox',
            align: 'stretch'
        };
        this.items = [{
            flex: 1,
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            border: false,
            defaults: {
                frame: true
            },
            items: [{
                title: 'Page Details',
                xtype: 'pageform',
                margin: '2 1 1 2',
                flex: 1,
                data: me.record.data
            }, {
                margin: '2 2 1 1',
                flex: 1,
                title: 'Page Analytics'
            }]
        },{
            flex: 1,
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            border: false,
            defaults: {
                frame: true
            },
            items: [{
                margin: '1 1 2 2',
                flex: 1,
                title: 'Page Analytics'
            },{
                margin: '1 2 2 1',
                flex: 1,
                title: 'Page Analytics'
            }]
        }];
        this.callParent();
    }
});