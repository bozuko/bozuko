Ext.define('Bozuko.view.contest.edit.Details' ,{

    extend: 'Ext.form.Panel',
    alias : 'widget.contestformdetails',

    requires: [
        'Ext.ux.form.field.DateTime'
    ],
    autoScroll: true,
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
            value           :new Date(),
            fieldLabel      :'Start Date'
        },{
            xtype           :'datetimefield',
            name            :'end',
            format          :'m/d/Y g:i:s A',
            value           :Ext.Date.add(new Date(), Ext.Date.DAY, 14),
            fieldLabel      :'End Date'
        },{
            xtype           :'textfield',
            name            :'win_frequency',
            fieldLabel      :'Win Frequency'
        },{
            xtype           :'checkbox',
            name            :'post_to_wall',
            fieldLabel      :'Post Wins to User\'s Wall'
        },{
            xtype           :'checkbox',
            name            :'web_only',
            fieldLabel      :'Web Only'
        },{
            xtype           :'textfield',
            name            :'alias',
            fieldLabel      :'Alias'
        },{
            xtype           :'checkbox',
            name            :'active',
            fieldLabel      :'Active'
        },{
            xtype               :'checkbox',
            name                :'end_alert_sent',
            fieldLabel          :'End Alert Sent'
        },{
            xtype               :'combo',
            name                :'engine_type',
            fieldLabel          :'Contest Engine',
            width               :100,
            allowBlank          :false,
            editable            :false,
            forceSelection      :true,
            value               :'order',
            displayField        :'text',
            valueField          :'value',
            queryMode           :'local',
            store               :Ext.create('Ext.data.Store',{
                fields              :['text','value'],
                data                :[{value:'order',text:'Order Based'},{value:'time',text:'Time Based'}]
            })
        },{
            xtype               :'textfield',
            name                :'window_divisor',
            fieldLabel          :'Window divisor'
        },{
            xtype               :'textfield',
            name                :'throwahead_multiplier',
            fieldLabel          :'Throwahead Multiplier'
        },{
            xtype               :'textfield',
            name                :'end_buffer',
            fieldLabel          :'End of game buffer' 
        },{
            xtype               :'textfield',
            name                :'lookback_threshold',
            fieldLabel          :'Lookback Threshold'
        },{
            xtype           :'htmleditor',
            name            :'promo_copy',
            height          :300,
            labelAlign      :'top',
            fieldLabel      :'Promotional Copy'
        }];
        me.callParent();
    }
});
