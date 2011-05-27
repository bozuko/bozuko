Ext.define('Bozuko.view.contest.edit.Details' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformdetails',
    
    requires: [
        'Ext.ux.form.field.DateTime'
    ],
    
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
            xtype           :'datetimefield',
            name            :'start',
            format          :'m/d/Y g:i:s A',
            fieldLabel      :'Start Date'
        },{
            xtype           :'datetimefield',
            name            :'end',
            format          :'m/d/Y g:i:s A',
            fieldLabel      :'End Date'
        },{
            xtype           :'textfield',
            name            :'win_frequency',
            fieldLabel      :'Win Frequency'
        }];
        me.callParent();
    }
});