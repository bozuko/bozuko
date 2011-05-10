Ext.define('Bozuko.view.page.List' ,{
    extend: 'Ext.panel.Panel',
    alias: 'widget.pagelist',
    
    initComponent : function(){
        this.html = 'Page list';
        this.layout = 'fit';
        this.title = 'All Businesses',
        this.items = [{
            xtype: 'dataview',
            store: this.store,
            autoScroll: true,
            overItemCls: 'page-over',
            selectedItemCls: 'page-selected',
            tpl :[
                '<div class="page-list">',
                    '<tpl for=".">',
                        '<div class="page">',
                            '<img src="{image}&type=square" />',
                            '<span class="name">{name}</span>',
                            '<div class="address">',
                                '{location.street}<br />{location.city}, {location.state}',
                            '</div>',
                        '</div>',
                    '</tpl>',
                '</div>'
            ],
            itemSelector: '.page',
            emptyText:'No Pages'
        }];
        this.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: 'Add Business',
                action: 'add'
            }]
        }]
        this.callParent();
    }
});