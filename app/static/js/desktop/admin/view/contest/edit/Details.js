Ext.define('Bozuko.view.contest.edit.Details' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformdetails',
    
    requires: [],
    
    layout: 'anchor',
    bodyPadding: 10,
    defaults: {
        anchor          :'0'
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
            name            :'total_entries',
            fieldLabel      :'Total Entries'
        },{
            xtype           :'combo',
            name            :'game',
            fieldLabel      :'Game',
            store           :Ext.create('Ext.data.Store',{
                fields:['value', 'text'],
                data:[
                    {value:'slots',text:'Slots'},
                    {value:'scratch',text:'Scratch'}
                ]
            }),
            displayField    :'text',
            valueField      :'value'
        }];
        me.callParent();
    }
});