Ext.define('Bozuko.view.contest.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestpanel',
    
    requires: ['Bozuko.view.contest.Grid','Bozuko.view.contest.Form'],
    
    layout: {
        type        :'border'
    },
    
    initComponent : function(){
        var me = this;
        
        me.empty = Ext.create('Bozuko.model.Contest');
        
        me.items = [{
            region          :'north',
            xtype           :'contestgrid',
            tbar            :[{
                text            :'Create Campaign',
                action          :'create'
            },'->',{
                text            :'Refresh Campaigns',
                action          :'refresh'
            }],
            split           :true,
            height          :116,
            store           :me.store
        },{
            region          :'center',
            xtype           :'contestform'
        }];
        me.callParent();
        me.down('contestform').setRecord( me.empty );
    }
});