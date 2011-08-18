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
                html : me.getIntroHTML(),
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
                ],
                listeners           :{
                    scope               :me,
                    change              :me.updateContest
                }
            },{
                xtype               :'displayfield',
                name                :'total_entries_display',
                xmode               :'odds',
                fieldLabel          :'Total Entries'
            },{
                xtype               :'textfield',
                name                :'total_entries',
                xmode               :'entry',
                maskRE              :/0-9/,
                hidden              :true,
                disabled            :true,
                fieldLabel          :'Total Entries',
                helpText            :[
                    'Enter the total number of entries for the campaign.'
                ],
                listeners           :{
                    scope               :me,
                    change              :me.updateContest
                }
            },{
                xtype               :'displayfield',
                name                :'overall_odds_display',
                xmode               :'entry',
                hidden              :true,
                disabled            :true,
                fieldLabel          :'Overall Odds'
            },{
                xtype               :'dataview',
                store               :me.contest.prizes(),
                itemSelector        :'.prize-odds',
                trackOver           :false,
                tpl                 :new Ext.XTemplate(
                    '<div class="prizes-odds">',
                        '<h3>Prizes Odds</h3>',
                        '<ul>',
                            '<tpl for=".">',
                                '<li class="prize-odds">',
                                    '<div class="prize-name">',
                                        '{name}',
                                    '</div>',
                                    '<div class="prize-odds-value">',
                                        '{[this.getPrizeOdds(xindex)]}',
                                    '</div>',
                                '</li>',
                            '</tpl>',
                        '</ul>',
                    '</div>',
                    {
                        getPrizeOdds : function(index){
                            return me.contest.getPrizeOdds(index-1);
                        }
                    }
                )
                
            }]
        });
        me.callParent(arguments);
        me.intro = me.down('[ref=intro]');
        me.contest.prizes().on('update', me.onStoreUpdate, me);
        me.contest.prizes().on('add', me.onStoreUpdate, me);
        me.contest.prizes().on('remove', me.onStoreUpdate, me);
    },
    
    initSwitcher : function(){
        var me = this;
        me.switcher = me.intro.getEl().down('.switcher');
        me.switcherLink = me.switcher.down('a');
        me.switcherLink.on('click', me.switchMode, me);
    },
    
    updateDisplayFields : function(){
        var me = this,
            value;
        if( me.mode == 'odds' ){
            value = Number(me.down('[name=win_frequency]').getValue()) * me.contest.getTotalPrizeCount();
                
            me.down('[name=total_entries_display]')
                .setValue(value);
        }
        else{
            
            value =  Number(me.down('[name=total_entries]').getValue()) / me.contest.getTotalPrizeCount();
            me.down('[name=overall_odds_display]')
                .setValue(
                    'One of Every <strong>'+
                        value.toFixed(2)
                    +'</strong> Players Win'
                );
        }
    },
    
    updateContest : function(){
        var me = this;
        if( me.mode == 'odds' ){
            // need to get the total
            me.contest.set('total_entries', Math.ceil(me.down('[name=win_frequency]').getValue() * me.contest.getTotalPrizeCount() ))
        }
        else{
            me.contest.set('total_entries', Number(me.down('[name=total_entries]').getValue()));
            me.contest.set('win_frequency', Number(me.down('[name=total_entries]').getValue()) / me.contest.getTotalPrizeCount());
        }
        me.updateDisplayFields();
        me.down('dataview').refresh();
    },
    
    onStoreUpdate : function(){
        this.updateDisplayFields();
    },
    
    switchMode : function(){
        var me = this;
        Ext.each(me.query('[xmode='+me.mode+']'), function(field){
            field.hide();
            field.disable();
        });
        me.mode = me.mode=='odds'?'entry':'odds';
        me.intro.update(me.getIntroHTML());
        Ext.each(me.query('[xmode='+me.mode+']'), function(field){
            field.show();
            field.enable();
        });
        me.initSwitcher();
        me.updateDisplayFields();
    },
    
    getIntroHTML : function(mode){
        var me = this;
        
        mode = mode || me.mode;
        return [
            me.introText,
            me[me.mode=='odds'?'oddsText':'entryText']
        ].join('<br /><br />');
    }
    
});