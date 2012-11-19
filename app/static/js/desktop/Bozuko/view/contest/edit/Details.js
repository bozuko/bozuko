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
            fieldLabel      :'Start Date',
            listeners       :{scope: me}
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
            name            :'hide_consolations',
            fieldLabel      :'Hide Consolation Prizes in Prize List'
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
            xtype           :'textfield',
            name            :'redirect_url',
            fieldLabel      :'Non-mobile Url'
        },{
            xtype           :'textfield',
            name            :'share_url',
            fieldLabel      :'Share Url',
            emptyText       :'Leave empty for share pages to go to default page.'
        },{
            xtype           :'textfield',
            name            :'share_title',
            fieldLabel      :'Share Title',
            emptyText       :'Leave empty for default text.'
        },{
            xtype           :'textfield',
            name            :'share_description',
            fieldLabel      :'Share Description',
            emptyText       :'Leave empty for default description.'
        },{
            xtype           :'textfield',
            name            :'win_share_title',
            fieldLabel      :'Win Share Title',
            emptyText       :'Leave empty for default text. Use {prize} for prize name, {user} for user\'s name.'
        },{
            xtype           :'textfield',
            name            :'win_share_description',
            fieldLabel      :'Win Share Description',
            emptyText       :'Leave empty for default description. Use {prize} for prize name, {user} for user\'s name.'
        },{
            xtype           :'checkbox',
            name            :'multiplay',
            fieldLabel      :'Multiplay'
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
            xtype           :'textfield',
            name            :'game_background',
            fieldLabel      :'Background'
        },{
            xtype           :'textfield',
            name            :'admin_emails',
            fieldLabel      :'Admin Emails'
        },{
            xtype           :'htmleditor',
            name            :'ingame_copy',
            height          :300,
            labelAlign      :'top',
            fieldLabel      :'In Game Copy'
        },{
            xtype           :'htmleditor',
            name            :'promo_copy',
            height          :300,
            labelAlign      :'top',
            fieldLabel      :'Promotional Copy'
        },{
            xtype               :'fieldset',
            title               :'Loser Emails',
            defaults            :{
                labelWidth          :150,
                anchor              :'0',
                xtype               :'textfield'
            },
            items               :[{
                xtype               :'checkbox',
                name                :'email_loser',
                fieldLabel          :'Send Loser Emails'
            },{
                name                :'loser_email_replyto',
                fieldLabel          :'Reply To'
            },{
                name                :'loser_email_subject',
                fieldLabel          :'Subject'
            },{
                xtype               :'combo',
                name                :'email_format',
                fieldLabel          :'Email Format',
                value               :'text/plain',
                allowBlank          :false,
                editable            :false,
                forceSelection      :true,
                displayField        :'value',
                valueField          :'value',
                queryMode           :'local',
                store               :Ext.create('Ext.data.Store',{
                    fields              :['value'],
                    data                :[{value:'text/plain'},{value:'text/html'}]
                }),
                listeners           :{
                    change              :function(){
                        this.onTypeChange();
                    },
                    render              :function(){
                        var self = this;
                        setTimeout(function(){
                            self.onTypeChange();
                        }, 500);
                    }
                },
                
                onTypeChange    :function(){
                    var val = this.getValue();
                    var body = me.down('[name=loser_email_body]');
                    switch(val){
                        case 'text/plain':
                            body.toggleSourceEdit(true);
                            break;
                        case 'text/html':
                            body.toggleSourceEdit(false);
                            break;
                    }
                }
            },{
                xtype               :'htmleditor',
                name                :'loser_email_body',
                fieldLabel          :'Body'
            }]
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
            prize_count = me.up('contestform').contest.getTotalPrizeCount(),
            step = Math.floor( duration / me.up('contestform').contest.getTotalPrizeCount() )
            ;
        if( !prize_count || !value ) return text_cmp.update('');
        
        switch(name){
            case 'window_divisor':
                var lookback_window = Math.round(step / value);
                text_cmp.update('Lookback Window: '+me.duration(lookback_window));
                break;
            
            case 'throwahead_multiplier':
                
                var throwahead_window = Math.round(step * value);
                text_cmp.update('Throwahead Window: '+me.duration(throwahead_window));
                break;
            
            case 'end_buffer':
                var date = new Date( +start +Math.floor((+end-start)*(1-value)) );
                text_cmp.update('End Buffer Start: '+Ext.Date.format(date,'Y-m-d h:i a'));
                break;
                
            case 'lookback_threshold':
                var date = new Date(+end - Math.floor((+end -start)*value));
                text_cmp.update('Lookback Threshold Start: '+Ext.Date.format(date,'Y-m-d h:i a'));
                break;
                
            default:
                break;
        }
        
        return true;
    },
    
    duration : function(ms, hide1){
        
        function pluralize(num, str, hide1, pstr){
            if( !pstr ) pstr = str+'s';
            var ret = hide1 && num===1 ? '' : (num+' ');
            return ret+ (num === 1 ? str : pstr);
        }
        
        function round5(x){
            return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
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
