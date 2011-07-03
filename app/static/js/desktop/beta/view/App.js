Ext.define('Beta.view.App', {
    
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.view.winners.List',
        'Beta.view.page.Dashboard',
        'Beta.view.contests.Panel',
        'Bozuko.store.Contests'
    ],
    
    cls: 'beta-panel',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            height: 400,
            layout: 'border',
            border: false,
            items:[{
                region          :'north',
                border          :false,
                xtype           :'toolbar',
                ref             :'navigation',
                style           :'border-width: 0px; border-bottom-width: 1px; padding: 4px;',
                bodyPadding     :4,
                defaults: {
                    xtype: 'button',
                    scale: 'medium',
                    cls:'x-btn-text-icon',
                    iconAlign: 'left'
                },
                items:[{
                    page        :'dashboard',
                    text        :'Dashboard',
                    group       :'page',
                    pressed     :true,
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/page-24.png'
                },{
                    page        :'campaigns',
                    text        :'Campaigns',
                    group       :'page',
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/dice-white-24.png'
                },{
                    text        :'Settings',
                    page        :'settings',
                    group       :'page',
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/settings-24.png'
                }]
            },{
                region          :'center',
                layout          :'card',
                ref             :'pages',
                border          :false,
                activeItem      :1,
                items: [{
                    ref             :'dashboard',
                    xtype           :'pagedashboard',
                    border          :false
                },{
                    ref             :'campaigns',
                    xtype           :'contestspanel',
                    border          :false,
                    store           :Ext.create('Bozuko.store.Contests', {
                        page_id         :Bozuko.beta.page_id,
                        autoLoad        :true
                    })
                },{
                    ref             :'settings',
                    border          :false,
                    html            :'settings'
                }]
            }]
        });
        
        me.callParent(arguments);
    }
    
});