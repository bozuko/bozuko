Ext.define('Bozuko.view.contest.edit.Game' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformgame',
    
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
        },{
            xtype           :'combo',
            name            :'free_play_pct',
            fieldLabel      :'Free Plays',
            store           :Ext.create('Ext.data.Store',{
                fields:['value', 'text'],
                data:[
                    {value:'0',text:'None'},
                    {value:'10',text:'10%'},
                    {value:'20',text:'20%'},
                    {value:'30',text:'30%'},
                    {value:'40',text:'40%'},
                    {value:'50',text:'50%'}
                ]
            }),
            displayField    :'text',
            valueField      :'value'
        }];
        me.callParent();
        
        // we have some 
        
    }
});