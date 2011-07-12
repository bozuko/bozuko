Ext.define('Admin.view.contest.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestpanel',
    
    requires: [
        'Admin.view.contest.View'
    ],
    layout: 'border',
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            region          :'center',
            bodyPadding     :10,
            autoScroll      :true,
            border          :false,
            bodyCls         :'contestpanel',
            items: [{
                style           :'float:right',
                xtype           :'button',
                scale           :'medium',
                action          :'create',
                text            :'Create Campaign',
                icon            :"/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/plus-24.png"
            },{
                xtype           :'component',
                autoEl          :{tag:'h1'},
                html            :'Campaigns'
            },{
                xtype           :'contestsview',
                store           :me.store
            }]
        },{
            region          :'east',
            xtype           :'winnerslist',
            split           :true,
            width           :250,
            margin          :'2 2 2 0',
            title           :'Winners List'
        }];
        
        window.contests = me.store;
        
        me.callParent();
    }
});