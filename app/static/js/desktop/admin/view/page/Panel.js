Ext.define('Admin.view.page.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.pagepanel',
    
    requires: [
        'Admin.view.page.Form',
        'Admin.view.contest.Panel'
    ],
    
    layout: 'card',
    border: false,
    defaults: {
        border: false
    },
    
    initComponent : function(){
        var me = this;
        
        me.tbar = Ext.create('Ext.toolbar.Toolbar',{
            ref         :'page-navbar',
            defaults: {
                
                xtype: 'button',
                scale: 'medium',
                cls:'x-btn-text-icon',
                iconAlign: 'left'
            },
            items:[{
                page        :'campaigns',
                text        :'Campaigns',
                group       :'page',
                pressed     :true,
                icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/dice-white-24.png'
            },{
                text        :'Settings',
                page        :'settings',
                group       :'page',
                icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/settings-24.png'
            }]
        });
        me.items = [{
            xtype       :'contestpanel',
            store: Ext.create('Bozuko.store.Contests', {
                page_id: me.record.get('_id'),
                autoLoad: true
            })
        },{
            xtype       :'pageform',
            data        :me.record.data
        }];
        me.callParent();
    }
});