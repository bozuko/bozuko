Ext.define('Bozuko.view.page.Panel', {
    
    extend: 'Ext.panel.Panel',
    alias: 'widget.pagepanel',
    
    requires: [
        'Bozuko.view.page.Welcome',
        'Bozuko.view.page.Dashboard',
        'Bozuko.view.contests.Panel',
        'Bozuko.view.page.Settings',
        'Bozuko.view.page.Resources',
        'Bozuko.view.page.Account',
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
                    page        :'welcome',
                    text        :'Welcome',
                    group       :'page',
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/star-24.png'
                },{
                    page        :'dashboard',
                    text        :'Dashboard',
                    group       :'page',
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
                },{
                    text        :'Resources',
                    page        :'resources',
                    group       :'page',
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/page-forum-24.png'
                },{
                    text        :'Account',
                    page        :'account',
                    group       :'page',
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/person-profile-24.png'
                },'->',{
                    ref         :'status-text',
                    xtype       :'tbtext',
                    text        :' '
                },{
                    ref         :'help-button',
                    icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/circle-blue-help-24.png'
                }]
            },{
                region          :'center',
                layout          :{
                    type            :'card'
                },
                ref             :'pages',
                border          :false,
                activeItem      :0,
                items: [{
                    ref             :'welcome',
                    xtype           :'pagewelcome',
                    border          :false,
                    page            :me.page
                },{
                    ref             :'dashboard',
                    xtype           :'pagedashboard',
                    border          :false,
                    page            :me.page
                },{
                    ref             :'campaigns',
                    xtype           :'contestspanel',
                    border          :false,
                    store           :Ext.create('Bozuko.store.Contests', {
                        page_id         :me.page.get('_id'),
                        autoLoad        :true
                    })
                },{
                    ref             :'settings',
                    xtype           :'pagesettings',
                    border          :false,
                    record          :me.page
                },{
                    ref             :'resources',
                    xtype           :'pageresources',
                    border          :false,
                    page            :me.page
                },{
                    ref             :'account',
                    xtype           :'pageaccount',
                    border          :false,
                    page            :me.page
                }]
            }]
        });
        me.callParent(arguments);
        me.statusText = me.down('[ref=navigation] [ref=status-text]');
        me.on('destroy', function(){
            clearTimeout( me.statusTextTimeout );
        });
    },
    
    updateStatus : function(text){
        var me = this;
        
        clearTimeout( me.statusTextTimeout );
        me.statusText.setText(text);
        me.statusTextTimeout = setTimeout( function(){
            me.statusText.setText('');
        },3000);
    },
    
    successStatus : function(text){
        this.updateStatus( '<div style="color: #999; line-height: 20px;">'+text+'<img style="margin: 0 0 0 4px; vertical-align:middle;" width="16" height="16" src="/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-check-16.png" /></div>')
    },
    
    failureStatus : function(text){
        this.updateStatus( '<div style="color: #999; line-height: 20px;">'+text+'<img style="margin: 0 0 0 4px; vertical-align:middle;" width="16" height="16" src="/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-cross-16.png" /></div>')
    }
    
});