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
            xtype               :'fieldcontainer',
            fieldLabel          :'Window Divisor',
            layout              :'hbox',
            items               :[{
                width               :80,
                xtype               :'textfield',
                name                :'window_divisor',
                hideLabel           :true,
                listeners           :{scope: me, change: me.onTimeValueChange}
            },{xtype: 'splitter'},{
                xtype               :'component',
                ref                 :'window_divisor_text'
            }]
        },{
            xtype               :'fieldcontainer',
            fieldLabel          :'Throwahead Multiplier',
            layout              :'hbox',
            items               :[{
                width               :80,
                xtype               :'textfield',
                name                :'throwahead_multiplier',
                hideLabel           :true,
                listeners           :{scope: me, change: me.onTimeValueChange}
            },{xtype: 'splitter'},{
                xtype               :'component',
                ref                 :'throwahead_multiplier_text'
            }]
        },{
            xtype               :'fieldcontainer',
            fieldLabel          :'End of Game Buffer',
            layout              :'hbox',
            items               :[{
                width               :80,
                xtype               :'textfield',
                name                :'end_buffer',
                hideLabel           :true,
                listeners           :{scope: me, change: me.onTimeValueChange}
            },{xtype: 'splitter'},{
                xtype               :'component',
                ref                 :'end_buffer_text'
            }]
        },{
            xtype               :'fieldcontainer',
            fieldLabel          :'Lookback Threshold',
            layout              :'hbox',
            items               :[{
                width               :80,
                xtype               :'textfield',
                name                :'lookback_threshold',
                hideLabel           :true,
                listeners           :{scope: me, change: me.onTimeValueChange}
            },{xtype: 'splitter'},{
                xtype               :'component',
                ref                 :'lookback_threshold_text'
            }]
        },{
            xtype           :'htmleditor',
            name            :'promo_copy',
            height          :300,
            labelAlign      :'top',
            fieldLabel      :'Promotional Copy'
        }];
        me.callParent();
    },
    
    onTimeValueChange : function(cmp){
        var me = this,
            name = cmp.name,
            value = Number(cmp.getValue()),
            text = name+'_text',
            text_cmp = cmp.up('fieldcontainer').down('[ref='+text+']'),
            start = me.down('[name=start]').getValue(),
            end = me.down('[name=end]').getValue(),
            duration = +end -start,
            step = Math.floor( duration / me.up('contestform').contest.getTotalPrizeCount() )
            ;
        
        switch(name){
            case 'window_divisor':
                var lookback_window = Math.round(step / value);
                text_cmp.getEl().update('Lookback Window: '+me.duration(lookback_window));
                break;
            default:
                break;
        }
    },
    
    duration : function(ms, hide1){
        
        function pluralize(num, str, hide1, pstr){
            if( !pstr ) pstr = str+'s';
            var ret = hide1 && num===1 ? '' : (num+' ');
            return ret+ (num === 1 ? str : pstr);
        }

        
        var DateUtil = {},
            DU = DateUtil;
            
        DU.SECOND = 1000;
        DU.MINUTE = DU.SECOND*60;
        DU.HOUR = DU.MINUTE*60;
        DU.DAY = DU.HOUR * 24;
        DU.WEEK = DU.DAY * 7;
            
        if( ms >= (DateUtil.WEEK * 2) ){
            return pluralize(( ms / DateUtil.WEEK ).toFixed(2), 'week', hide1);
        }
        
        if( ms >= (DateUtil.DAY * 3) ){
            return pluralize(( ms / DateUtil.DAY ).toFixed(2), 'day', hide1);
        }
        
        if( ms >= (DateUtil.HOUR * 2).toFixed(2) ){
            var v = Math.round( ms / DateUtil.HOUR );
            if( v > 15 ) v = round5(v);
            return pluralize(v, 'hour', hide1);
        }
        
        if( ms >= (DateUtil.MINUTE - (DateUtil.SECOND*30)) ){
            return pluralize(Math.round( ms / DateUtil.MINUTE ), 'minute', hide1);
        }
        
        return pluralize(Math.round( ms / DateUtil.SECOND ) || 1, 'second', hide1);
    }
});
