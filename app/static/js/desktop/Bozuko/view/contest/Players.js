Ext.define( 'Bozuko.view.contest.Players', {
    alias : 'widget.contestplayers',
    extend : 'Ext.tab.Panel',
    
    requires : [
        'Bozuko.model.User',
        'Bozuko.view.contest.Winners',
        'Bozuko.view.contest.Entries'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply( me, {
            activeItem      :0,
            items           :[{
                title           :'Winners',
                xtype           :'contestwinners',
                contest_id      :me.contest_id,
                page_id         :me.page_id
            },{
                xtype           :'contestentries',
                title           :'Entries',
                contest_id      :me.contest_id,
                page_id         :me.page_id
            }]
        });
        
        me.callParent(arguments);
    }
});