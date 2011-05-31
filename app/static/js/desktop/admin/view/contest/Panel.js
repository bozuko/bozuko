Ext.define('Bozuko.view.contest.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestpanel',
    
    requires: ['Bozuko.view.contest.View'],
    autoScroll: true,
    bodyPadding: 10,
    bodyCls: 'contestpanel',
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
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
        }];
        me.callParent();
    }
});