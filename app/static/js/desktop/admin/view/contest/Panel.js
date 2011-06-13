Ext.define('Bozuko.view.contest.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestpanel',
    
    requires: ['Bozuko.view.contest.View'],
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
            width           :330,
            margin          :'0 2 2',
            title           :'Winners List'
        }];
        me.callParent();
    }
});