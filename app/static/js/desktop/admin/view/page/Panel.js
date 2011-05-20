Ext.define('Bozuko.view.page.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.pagepanel',
    
    requires: [
        'Bozuko.view.page.Form',
        'Bozuko.view.contest.Panel'
    ],
    
    layout: 'card',
    border: false,
    defaults: {
        border: false
    },
    
    initComponent : function(){
        var me = this;
        
        me.tbar = Ext.create('Ext.toolbar.Toolbar',{
            ref         :'navbar',
            defaults: {
                xtype: 'button',
                scale: 'medium',
                iconAlign: 'top'
            },
            items:[{
                text        :'Settings',
                page        :'settings',
                icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/settings-24.png',
                pressed     :true
            },{
                page        :'campaigns',
                text        :'Campaigns',
                icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/dice-white-24.png'
            }]
        });
        me.items = [{
            xtype       :'pageform',
            data        :me.record.data
        },{
            xtype       :'contestpanel',
            store: Ext.create('Bozuko.store.Contests', {
                page_id: me.record.get('_id'),
                autoLoad: true
            })
        }];
        me.callParent();
    }
});