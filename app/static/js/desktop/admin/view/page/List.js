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
            
            trackOver: true,
            
            overItemCls: 'list-item-over',
            selectedItemCls: 'list-item-selected',
            itemSelector: '.list-item',
            
            tpl :new Ext.XTemplate(
                '<ul class="bozuko-list">',
                    '<tpl for=".">',
                        '<li class="list-item">',
                            '<img src="{[this.getImage(values.image)]}" />',
                            '<span class="title">{name}</span>',
                            '<div class="sub">',
                                '{location.street}<br />{location.city}, {location.state}',
                            '</div>',
                        '</li>',
                    '</tpl>',
                '</ul>',
                {
                    getImage: function(image){
                        if( /facebook\.com/.test(image) ){
                            image = image.replace(/type=large/, 'type=square');
                        }
                        return image;
                    }
                }
            ),
            
            emptyText:'No Pages'
        }];
        me.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: 'Add Business',
                action: 'add'
            },'->',{
                text: 'Refresh',
                icon: '/images/icons/famfamfam/icons/arrow_refresh.png',
                action: 'reload'
            }]
        }]
        me.callParent();
    }
});

// var old = Ext.get('biz-style');var ss = document.createElement('link');ss.rel='stylesheet';ss.type='text/css';ss.href=old.dom.href.replace(/(\?.*|$)/, '?'+new Date());old.remove();document.getElementsByTagName('head')[0].appendChild(ss);ss.id='biz-style';