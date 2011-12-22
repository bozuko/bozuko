Ext.define('Bozuko.view.contest.edit.Rules' ,{
    
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
            name            :'replace_rules',
            fieldLabel      :'Replace Bozuko Rules'
        },{
            xtype           :'textarea',
            height          :300,
            labelAlign      :'top',
            name            :'rules',
            fieldLabel      :'Custom Rules'
        }];
        me.callParent();
    },
    
    onAutoChange : function(field, val){
        var fn = val ? 'disable' : 'enable';
        this.down('[name=rules]')[fn]();
    }
});