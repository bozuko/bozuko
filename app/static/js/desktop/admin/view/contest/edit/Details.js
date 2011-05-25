Ext.define('Bozuko.view.contest.edit.Details' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformdetails',
    
    requires: [],
    
    layout: 'anchor',
    defaults: {
        anchor          :'0',
        labelWidth      :150
    },
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'textfield',
            name            :'name',
            fieldLabel      :'Name'
        },{
            xtype           :'datefield',
            name            :'start',
            fieldLabel      :'Start Date'
        },{
            xtype           :'datefield',
            name            :'end',
            fieldLabel      :'End Date'
        },{
            xtype           :'textfield',
            name            :'win_frequency',
            fieldLabel      :'Win Frequency'
        }];
        me.callParent();
    }
});