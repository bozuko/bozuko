Ext.define('Bozuko.view.page.List' ,{
    extend: 'Ext.panel.Panel',
    alias: 'widget.pagelist',
    
    initComponent : function(){
        var me = this;
        
        me.html = 'Page list';
        me.layout = 'fit';
        me.title = 'All Businesses',
        me.items = [{
            xtype: 'dataview',
            store: me.store,
            autoScroll: true,
            overItemCls: 'list-item-over',
            selectedItemCls: 'list-item-selected',
            tpl :[
                '<div class="bozuko-list">',
                    '<tpl for=".">',
                        '<div class="list-item">',
                            '<img src="{image}&type=square" />',
                            '<span class="title">{name}</span>',
                            '<div class="sub">',
                                '{location.street}<br />{location.city}, {location.state}',
                            '</div>',
                        '</div>',
                    '</tpl>',
                '</div>'
            ],
            itemSelector: '.list-item',
            emptyText:'No Pages'
        }];
        me.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: 'Add Business',
                action: 'add'
            },'->',{
                text: 'Reload',
                action: 'reload'
            }]
        }]
        me.callParent();
    }
});