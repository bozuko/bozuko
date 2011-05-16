Ext.define('Bozuko.view.Browser',{
    
    extend: 'Ext.panel.Panel',
    alias: 'widget.apibrowser',
    
    layout: 'border',
    border: false,
    
    initComponent : function(){
        
        var me = this;
        
        me.items = [{
            region: 'west',
            xtype: 'form',
            split: true,
            defaults:{
                anchor: '0',
                labelAlign: 'top'
            },
            margin: '4 1 4 4',
            bodyPadding: 10,
            title: 'Api Request',
            width: 300,
            collapsible: true,
            autoScroll: true,
            layout: 'anchor',
            tbar:[{
                text: 'Entry Point',
                action: 'entry'
            }],
            fbar:[{
                text: 'Make Request',
                action: 'request'
            }]
        },{
            region: 'center',
            margin: '4 1 4 1',
            autoScroll: true,
            title: 'Request Body',
            bodyPadding: 10,
            html: 'Make a request and see the results here.',
            tbar: [{
                text: 'Update Form',
                action: 'redo'
            }]
        },{
            region: 'east',
            margin: '4 4 4 1',
            split: true,
            collapsible: true,
            title: 'History',
            layout: 'fit',
            width: 250,
            items: [{
                xtype: 'dataview',
                autoScroll: true,
                overItemCls: 'list-item-over',
                selectedItemCls: 'list-item-selected',
                itemTpl: Ext.create('Ext.XTemplate',
                    '<div class="bozuko-list">',
                        '<tpl for=".">',
                            '<div class="list-item">',
                                '<div class="title">{status} {link}</div>',
                                '<div class="sub">{path}<br />{[this.formatDate(values.timestamp)]}</div>',
                            '</div>',
                        '</tpl>',
                    '</div>',
                    {
                        formatDate : function(date){
                            return Ext.Date.format(date,'m-d-Y H:i:s');
                        }
                    }
                ),
                itemSelector: '.list-item'
            }]
        }];
        
        this.callParent(arguments);
    }
});