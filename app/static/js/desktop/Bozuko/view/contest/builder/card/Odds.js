Ext.define('Bozuko.view.contest.builder.card.Odds', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderodds',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Bozuko.lib.form.field.WinFrequency'
    ],
    name            :"Contest Odds",
    overview        :[
        "<p>Configure the Entry totals here.</p>"
    ],
    
    introText :  'Please configure the odds / total entries for this game.',
    
    oddsText : [
        '<span class="switcher">If you would rather enter the total number of entries,',
        'switch to <a href="javascript:;" class="entry-mode">Entry Mode</a>'
    ].join(' '),
    
    entryText : [
        '<span class="switcher">If you would rather enter the overall odds,',
        'switch to <a href="javascript:;" class="odds-mode">Overall Odds Mode</a>'
    ].join(' '),
    
    mode : 'odds',

    initComponent : function(){
        var me = this;
        
        Ext.apply(me.form, {
            
            items               :[{
                xtype               :'component',
                ref                 :'intro',
                autoEl              :{
                    tag                 :'p'
                },
                style               :{
                    'margin-bottom'     :'2em'
                },
                html : [me.introText, me.oddsText].join('<br /><br />'),
                listeners : {
                    render: Ext.Function.createBuffered(me.initSwitcher, 10, me)
                }
            },{
                xtype               :'winfrequencyfield',
                name                :'win_frequency',
                xmode               :'odds',
                fieldLabel          :'Overall Odds',
                helpText            :[
                    'Configure the overall Odds of for your campaign.'
                ]
            },{
                xtype               :'displayfield',
                name                :'total_entries_display',
                xmode               :'odds',
                fieldLabel          :'Total Entries'
            },{
                xtype               :'textfield',
                name                :'total_entries',
                xmode               :'entry',
                hidden              :true,
                disabled            :true,
                fieldLabel          :'Total Entries',
                helpText            :[
                    'Enter the total number of entries for the campaign.'
                ]
            },{
                xtype               :'displayfield',
                name                :'overall_odds_display',
                xmode               :'entry',
                hidden              :true,
                disabled            :true,
                fieldLabel          :'Overall Odds'
            }]
        });
        me.callParent(arguments);
        me.intro = me.down('[ref=intro]');
    },
    
    initSwitcher : function(){
        var me = this;
        me.switcher = me.intro.getEl().down('.switcher');
        me.switcherLink = me.switcher.down('a');
        me.switcherLink.on('click', me.switchMode, me);
    },
    
    switchMode : function(){
        var me = this;
        me.intro.update([
            me.introText,
            me[me.mode=='odds'?'oddsText':'entryText']
        ].join('<br /><br />'));
        Ext.each(me.query('[xmode='+me.mode+']'), function(field){
            field.hide();
            field.disable();
        });
        me.mode = me.mode=='odds'?'entry':'odds';
        Ext.each(me.query('[xmode='+me.mode+']'), function(field){
            field.show();
            field.enable();
        });
        me.initSwitcher();
    }
    
});