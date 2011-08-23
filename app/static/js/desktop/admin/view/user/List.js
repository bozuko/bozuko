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
                    '<div class="sub">',
                        'Friend Count: {[this.getFriendCount(values)]}<br />',
                        '<tpl if="blocked == true && allowed != true"><span style="color: red;">Blocked</span></tpl>',
                        '<tpl if="blocked!=true || allowed == true"><span style="color: green;">Allowed</span></tpl>',
                    '</div>',
                '</div>',
                {
                    getImage: function(image){
                        if( /facebook\.com/.test(image) ){
                            image = image.replace(/type=large/, 'type=square');
                        }
                        return image;
                    },
                    getFriendCount: function(values){
                        var count = 0;
                        Ext.Array.each( values.services, function(service){
                            if( service.name == 'facebook' ){
                                count = service.internal.friend_count;
                                return false;
                            }
                            return true;
                        });
                        return count;
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
                width: 100,
                emptyText: 'Search...',
                inputType: 'search',
                enableKeyEvents: true
            },'->',{
                xtype : 'cycle',
                showText: true,
                cls: 'x-btn-text',
                ref: 'filter',
                menu: {
                    items : [{
                        text : 'All Users',
                        checked: true,
                        value: 'all'
                    },{
                        text : 'Blocked',
                        value: 'blocked'
                    },{
                        text : 'Allowed',
                        value: 'allowed'
                    },{
                        text : '< 10 Friends',
                        value: 'losers'
                    }]
                }
            }]
        },{
            dock: 'bottom',
            xtype: 'pagingtoolbar',
            store: me.store,
            displayInfo: true
        }]
        me.callParent();
    }
});

// var old = Ext.get('biz-style');var ss = document.createElement('link');ss.rel='stylesheet';ss.type='text/css';ss.href=old.dom.href.replace(/(\?.*|$)/, '?'+new Date());old.remove();document.getElementsByTagName('head')[0].appendChild(ss);ss.id='biz-style';