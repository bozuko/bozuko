Ext.define('Bozuko.view.contest.edit.Entry' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformentry',
    
    requires: ['Bozuko.lib.form.field.Duration'],
    
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
            fieldLabel      :'Method of Entry',
            emptyText       :'Please Select the Entry Type',
            value           :'facebook/checkin',
            editable        :false,
            forceSelection  :true,
            queryMode       :'local',
            store           :Ext.create('Ext.data.Store',{
                fields:['value', 'text'],
                data:[
                    {value:'facebook/likecheckin',text:'Facebook Like and Checkin'},
                    {value:'facebook/checkin',text:'Facebook Check-in'},
                    {value:'facebook/like',text:'Facebook Like'},
                    {value:'bozuko/optin',text:'Newsletter Subscribe'},
                    {value:'bozuko/checkin',text:'Bozuko Check-in'},
                    {value:'bozuko/nothing',text:'Bozuko Play'}
                ]
            }),
            displayField    :'text',
            valueField      :'value',
            
            listeners       :{
                scope           :me,
                change          :me.onEntryTypeChange
            }
            
        },{
            xtype           :'checkbox',
            name            :'options.enable_like',
            fieldLabel      :'Additional Like Entry',
            hidden          :true
        },{
            xtype           :'textfield',
            name            :'options.radius',
            fieldLabel      :'Radius (mi)',
            regex           :/[0-9]/,
            hidden          :true
        },{
            xtype           :'textfield',
            name            :'tokens',
            fieldLabel      :'Plays per Entry'
        },{
            xtype           :'duration',
            name            :'duration',
            fieldLabel      :'Entry Duration (ms)',
            value           :1000 * 60 * 60
        }];
        me.callParent();
        me.on('render', function(){
            var type = me.down('[name=type]');
            me.onEntryTypeChange(type, type.getValue());
        });
    },
    
    onEntryTypeChange : function(field, value){
        var fn = value == 'facebook/checkin' ? 'show' : 'hide';
        this.down('[name=options.enable_like]')[fn]();
        fn = value == 'facebook/like' ? 'show' : 'hide';
        this.down('[name=options.radius]')[fn]();
    },
    
    setValues : function(values){
        values['options.enable_like'] = values.options ? values.options.enable_like : false;
        values['options.radius'] = values.options ? values.options.radius : false;
        this.getForm().setValues(values);
    }
});