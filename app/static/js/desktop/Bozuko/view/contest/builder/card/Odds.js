Ext.define('Bozuko.view.contest.builder.card.Odds', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderodds',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Bozuko.lib.form.field.WinFrequency'
    ],
    name            :"Contest Odds",
    cls             :'builder-card contest-odds-card',
    overview        :[
        "<p>Configure the Entry totals here.</p>"
    ],
    
    oddsText : 'Average odds per player entry',
    
    entryText : 'Total Player Entries',

    initComponent : function(){
        var me = this;
        
        me.engine_options = me.contest.get('engine_options');
        me.mode = me.engine_options.mode || 'odds';
        
        Ext.apply(me.form, {
            
            items               :[{
                xtype               :'component',
                ref                 :'intro',
                autoEl              :{
                    tag                 :'h2'
                },
                html : me.getIntroHTML()
            },{
                xtype               :'winfrequencyfield',
                name                :'win_frequency',
                xmode               :'odds',
                hideLabel           :true,
                helpText            :[
                    '<p>Enter the odds that a player wins any prize when they enter this game. ',
                    'Note the effect overall odds have on individual prize odds.</p>',
                    '<p>Example:  If the overall odds are 1 in 4, you would expect that for every four players, on average one will win a prize.</p>'
                ],
                listeners           :{
                    scope               :me,
                    change              :me.updateContest
                }
            },{
                xtype               :'container',
                arrowCt             :'true',
                style               :'position:relative; overflow: visible',
                layout              :{
                    type                :'hbox',
                    pack                :'center'
                },
                border              :false,
                items               :[{
                    xtype               :'textfield',
                    name                :'total_entries',
                    xmode               :'entry',
                    style               :'text-align:center;',
                    maskRE              :/0-9/,
                    hidden              :true,
                    disabled            :true,
                    fieldLabel          :'Total Entries',
                    hideLabel           :true,
                    width               :100,
                    helpText            :[
                        '<p>Enter the total number of player entries you would like for this game.  Note the effect your total number of entries has on the odds of winning.</p>',
                        '<p>Example: If you have 10 total prize quantity and enter 100 total entries, the overall odds of any player entry winning is 1 in 10.</p>'
                    ],
                    listeners           :{
                        scope               :me,
                        change              :me.updateContest
                    }
                }]
            },{
                xtype               :'container',
                border              :false,
                style               :'text-align:center; position: relative;margin-bottom: 20px;',
                items               :[{
                    xtype               :'component',
                    ref                 :'alt-display',
                    cls                 :'alt-display',
                    autoEl              :{
                        tag                 :'div'
                    },
                    html                :'display',
                    listeners           :{
                        scope               :me,
                        render              :function(cmp){
                            me.alt_display=cmp;
                            me.updateDisplayFields();
                        }
                    }
                },{
                    xtype               :'component',
                    ref                 :'switcher',
                    autoEl              :{
                        tag                 :'a',
                        cls                 :'switcher',
                        href                :'javascript:;',
                        style               :{
                            position            :'absolute',
                            right               :'0px',
                            bottom              :'0px'
                        }
                    },
                    listeners           :{
                        render              :me.initSwitcher,
                        scope               :me
                    }
                }]
            },{
                xtype               :'dataview',
                store               :me.contest.prizes(),
                itemSelector        :'.prize-odds',
                trackOver           :false,
                tpl                 :new Ext.XTemplate(
                    '<div class="prizes-odds">',
                        '<h3>Prizes Odds</h3>',
                        '<table>',
                            '<tr>',
                                '<th>Name</th>',
                                '<th>Total Prizes</th>',
                                '<th>Odds per Entry</th>',
                                '<th>Odds per Play</th>',
                            '</tr>',
                            '<tpl for=".">',
                                '<tr class="prize-odds">',
                                    '<td class="prize-name">{name}</td>',
                                    '<td class="prize-total">{total}</td>',
                                    '<td class="prize-odds-value">',
                                        '{[this.getPrizeOdds(xindex)]}',
                                    '</td>',
                                    '<td class="prize-odds-value">',
                                        '{[this.getPrizePlayOdds(xindex)]}',
                                    '</td>',
                                '</tr>',
                            '</tpl>',
                        '</table>',
                    '</div>',
                    {
                        getPrizeOdds : function(index){
                            return me.contest.getPrizeOdds(index-1);
                        },
                        getPrizePlayOdds : function(index){
                            return me.contest.getPrizePlayOdds(index-1);
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
        me.on('activate', function(){
            me.down('dataview').refresh();
            me.updateContest();
            me.updateDisplayFields();
            // change mode accordingly.
            me.hideFields(me.mode=='odds'?'entry':'odds')
            me.showFields(me.mode!='odds'?'entry':'odds')
        });
    },
    
    initSwitcher : function(cmp){
        var me = this;
        cmp.update(me.mode=='odds'?'Switch to<br />Total Entry Mode':'Switch to<br />Average Odds Mode')
        cmp.getEl().on('click', function(){
            me.switchMode();
        });
    },
    
    updateDisplayFields : function(){
        var me = this,
            value,
            total_entries = me.down('[name=total_entries]'),
            win_frequency = me.down('[name=win_frequency]');
            
        if( !me.alt_display || !total_entries || !win_frequency ){
            console.log('not updating display fields');
            return;
        }
        if( me.mode == 'odds' ){
            value = Math.floor(Number(win_frequency.getValue()) * me.contest.getTotalPrizeCount());
            me.alt_display.update('Total Entries: '+value+'<br />Total Plays: '+me.contest.getTotalPlays()+'<br />Total Prizes: '+me.contest.getTotalPrizeCount() );
        }
        else{
            value =  Number(total_entries.getValue()) / me.contest.getTotalPrizeCount();
            me.alt_display.update('On Average, 1 in '+value.toFixed(2)+' entries will win'+'<br />Total Plays: '+me.contest.getTotalPlays()+'<br />Total Prizes: '+me.contest.getTotalPrizeCount()  );
        }
    },
    
    updateContest : function(){
        var me = this;
        if( !me.alt_display ){
            return;
        }
        if( me.mode == 'odds' ){
            // need to get the total
            me.contest.set('win_frequency', Number(me.down('[name=win_frequency]').getValue()));
            me.contest.set('total_entries', Math.ceil(me.down('[name=win_frequency]').getValue() * me.contest.getTotalPrizeCount() ))
            me.down('[name=total_entries]').setValue(me.contest.get('total_entries'));
        }
        else{
            me.contest.set('total_entries', Number(me.down('[name=total_entries]').getValue()));
            me.contest.set('win_frequency', (Number(me.down('[name=total_entries]').getValue()) / me.contest.getTotalPrizeCount()).toFixed(2));
            me.down('[name=win_frequency]').setValue(me.contest.get('win_frequency'));
        }
        me.updateDisplayFields();
        me.down('dataview').refresh();
    },
    
    onStoreUpdate : function(){
        this.updateDisplayFields();
    },
    
    switchMode : function(){
        var me = this;
        me.hideFields(me.mode);
        me.mode = me.mode=='odds'?'entry':'odds';
        me.engine_options.mode = me.mode;
        me.intro.update(me.getIntroHTML());
        me.showFields(me.mode);
        me.down('[ref=switcher]').update(me.mode=='odds'?'Switch to<br />Total Entry Mode':'Switch to<br />Average Odds Mode');
        me.updateDisplayFields();
        me.form.doLayout();
    },
    
    hideFields : function(mode){
        var me = this;
        Ext.each(me.query('[xmode='+mode+']'), function(field){
            field.hide();
            field.disable();
        });
    },
    
    showFields : function(mode){
        var me = this;
        Ext.each(me.query('[xmode='+mode+']'), function(field){
            field.show();
            field.enable();
        });
    },
    
    getIntroHTML : function(mode){
        var me = this;
        mode = mode || me.mode;
        return  me[me.mode=='odds'?'oddsText':'entryText'];
    }
    
});