Ext.define('Admin.view.contest.edit.Rules' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformrules',
    
    requires: [],
    
    layout: 'anchor',
    autoScroll: true,
    defaults: {
        anchor          :'0',
        labelWidth      :150
    },
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'checkbox',
            name            :'auto_rules',
            fieldLabel      :'Auto Generate Rules',
            listeners       :{
                scope           :me,
                change          :me.onAutoChange
            }
        },{
            xtype           :'textarea',
            height          :300,
            labelAlign      :'top',
            name            :'rules',
            fieldLabel      :'Rules'
        }];
        me.callParent();
    },
    
    onAutoChange : function(field, val){
        var fn = val ? 'disable' : 'enable';
        this.down('[name=rules]')[fn]();
    }
});