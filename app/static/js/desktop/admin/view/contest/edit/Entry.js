Ext.define('Bozuko.view.contest.edit.Entry' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformentry',
    
    requires: [],
    
    layout: 'anchor',
    defaults: {
        anchor          :'0',
        labelWidth      :150
    },
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'combo',
            name            :'type',
            fieldLabel      :'Entry Type',
            emptyText       :'Please Select the Entry Type',
            
            store           :Ext.create('Ext.data.Store',{
                fields:['value', 'text'],
                data:[
                    {value:'facebook/checkin',text:'Facebook Check-in'},
                    {value:'facebook/like',text:'Facebook Like'},
                    {value:'bozuko/checkin',text:'Bozuko Check-in'}
                ]
            }),
            displayField    :'text',
            valueField      :'value'
        },{
            xtype           :'checkbox',
            name            :'enable_like',
            fieldLabel      :'Additional Like Entry'
        },{
            xtype           :'textfield',
            name            :'tokens',
            fieldLabel      :'Plays per Entry'
        },{
            xtype           :'textfield',
            name            :'duration',
            fieldLabel      :'Entry Duration (ms)'
        }];
        me.callParent();
    }
});