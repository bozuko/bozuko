Ext.define('Admin.view.user.List' ,{
    extend: 'Ext.panel.Panel',
    alias: 'widget.userlist',
    
    requires: [
        'Bozuko.store.Users'
    ],
    
    initComponent : function(){
        var me = this;
        
        me.store = Ext.create('Bozuko.store.Users');
        me.store.on('load', function(){
            try{
                me.down('dataview').getEl().dom.scrollTop=0;
            }catch(e){
                
            }
        });
        
        me.layout = 'fit';
        me.title = 'All Users',
        me.items = [{
            xtype: 'dataview',
            store: me.store,
            autoScroll: true,
            cls: 'bozuko-list user-list',
            
            trackOver: true,
            itemOverCls: 'x-item-over',
            
            deferEmptyText: false,
            emptyText:'No Users',
            
            itemTpl :new Ext.XTemplate(
                '<div class="user-{[values.blocked&&!values.allowed?"blocked":"allowed"]}">',
                    '<img src="{[this.getImage(values.image)]}" />',
                    '<span class="title">{name}</span>',
                '</div>',
                {
                    getImage: function(image){
                        if( /facebook\.com/.test(image) ){
                            image = image.replace(/type=large/, 'type=square');
                        }
                        return image;
                    }
                }
            )
        }];
        me.dockedItems = [{
            dock: 'top',
            xtype: 'toolbar',
            items: [{
                xtype : 'textfield',
                ref: 'search',
                emptyText: 'Search...',
                inputType: 'search',
                enableKeyEvents: true
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