Ext.define('Bozuko.view.contest.edit.Window' ,{
    
    extend: 'Ext.window.Window',
    alias : 'widget.contesteditwindow',
    
    requires: ['Bozuko.view.contest.edit.Form'],
    
    layout: {
        type        :'fit'
    },
    
    width: 800,
    height: 600,
    border: false,
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'contestform'
        }];
        me.callParent();
        me.down('contestform').setRecord( me.record );
    }
});