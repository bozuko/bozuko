Ext.define('Admin.view.page.List' ,{
    extend: 'Ext.panel.Panel',
    alias: 'widget.pagelist',
    
    requires: [
        'Bozuko.store.Pages'
    ],
    
    initComponent : function(){
        var me = this;
        
        me.store = Ext.create('Bozuko.store.Pages');
        
        me.html = 'Page list';
        me.layout = 'fit';
        me.title = 'All Businesses',
        me.items = [{
            xtype: 'dataview',
            store: me.store,
            autoScroll: true,
            cls: 'bozuko-list page-list',
            
            trackOver: true,
            itemOverCls: 'x-item-over',
            
            itemTpl :new Ext.XTemplate(
                '<div class="page-{[values.active?"active":"inactive"]}">',
                    '<img src="{[this.getImage(values.image)]}" />',
                    '<span class="title">{name}</span>',
                    '<div class="sub">',
                        '{location.street}<br />{location.city}, {location.state}',
                    '</div>',
                '</div>',
                {
                    getImage: function(image){
                        if( /facebook\.com/.test(image) ){
                            image = image.replace(/type=large/, 'type=square');
                        }
                        return image;
                    }
                }
            ),
            
            listeners : {
                refresh : function(){
                    try{
                        me.down('dataview').getEl().scrollTo('top',0);
                    }catch(e){
                        
                    }
                }
            },
            
            emptyText:'No Pages'
        }];
        me.dockedItems = [{
            dock: 'top',
            xtype: 'toolbar',
            items: [{
                text: 'Add Business',
                icon: "/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/plus-16.png",
                action: 'add'
            }]
        },{
            dock: 'top',
            xtype: 'toolbar',
            items: [{
                xtype : 'textfield',
                ref: 'search',
                emptyText: 'Search...',
                inputType: 'search',
                enableKeyEvents: true
            },'->',{
                text: 'Show Inactive',
                ref: 'inactive',
                enableToggle: true
            }]
        },{
            dock: 'bottom',
            xtype: 'pagingtoolbar',
            store: me.store
        }]
        me.callParent();
    }
});

// var old = Ext.get('biz-style');var ss = document.createElement('link');ss.rel='stylesheet';ss.type='text/css';ss.href=old.dom.href.replace(/(\?.*|$)/, '?'+new Date());old.remove();document.getElementsByTagName('head')[0].appendChild(ss);ss.id='biz-style';