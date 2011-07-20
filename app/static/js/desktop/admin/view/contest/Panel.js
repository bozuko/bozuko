Ext.define('Admin.view.contest.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestpanel',
    
    requires: [
        'Bozuko.view.contest.List',
        'Bozuko.view.contest.Players'
    ],
    layout: 'border',
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            region          :'center',
            autoScroll      :true,
            border          :false,
            bodyCls         :'contestpanel',
            items: [{
                style           :'float:right; margin: 10px;',
                xtype           :'button',
                scale           :'medium',
                action          :'create',
                text            :'Create Campaign',
                icon            :"/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/plus-24.png"
            },{
                xtype           :'component',
                style           :'margin: 10px;',
                autoEl          :{tag:'h1'},
                html            :'Campaigns'
            },{
                xtype           :'contestlist',
                style           :'clear: both',
                store           :me.store
            }]
        },{
            region          :'east',
            xtype           :'contestplayers',
            page_id         :me.page.get('_id'),
            split           :true,
            width           :250,
            margin          :'2 2 2 0'
        }];
        
        window.contests = me.store;
        
        me.callParent();
    }
});