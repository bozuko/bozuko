Ext.define('Bozuko.view.contest.builder.card.Odds', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderodds',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Bozuko.lib.form.field.WinFrequency'
    ],
    name            :"Prize Serving",
    cls             :'builder-card contest-odds-card',
    overview        :[
        
    ],
    
    oddsText : 'Overall Odds per Entry',
    
    entryText : 'Total Player Entries',

    initComponent : function(){
        var me = this;
        
        me.engine_options = me.contest.get('engine_options');
        me.mode = me.engine_options.mode || 'odds';
        
        Ext.apply(me.form, {
            items               :[{
                name                :'engine_type',
                value               :'time',
                xtype               :'combo',
                cls                 :'combo',
                mode                :'local',
                anchor              :false,
                width               :220,
                editable            :false,
                forceSelection      :true,
                fieldLabel          :'Distribution Type',
                displayField        :'name',
                valueField          :'value',
                store               :{
                    data                :[{name:'Odds Based', value:'order'},{name:'Time Based', value:'time'}],
                    fields              :['name','value']
                },
                listeners           :{
                    change              :me.onEngineChange,
                    scope               :me
                }
            },{
                ref                 :'time-container',
                refCls              :'container',
                xtype               :'container',
                border              :false,
                items               :[{
                    xtype               :'component',
                    autoEl              :{tag:'p'},
                    html                :[
                        'Distribute the prizes over the course of the contest.'
                    ].join('')
                }]
            },{
                ref                 :'order-container',
                refCls              :'container',
                xtype               :'container',
                border              :false,
                hidden              :true,
                items:[{
                    xtype               :'component',
                    ref                 :'intro',
                    autoEl              :{
                        tag                 :'h2'
                    },
                    html : me.getIntroHTML()
                },{
                    xtype               :'container',
                    border              :false,
                    layout              :'anchor',
                    height              :50,
                    defaults            :me.form.defaults,
                    items               :[{
                        xtype               :'winfrequencyfield',
                        name                :'win_frequency',
                        xmode               :'odds',
                        hideLabel           :true,
                        helpText            :[
                            '<p>Enter the overall odds that a player wins any prize when they enter this game. ',
                            'Note the effect overall odds have on individual prize odds and the total number of entries.</p>',
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
                                '<p>Enter the total number of player entries you would like for this game.  Note the effect your total number of entries has on the overall odds.</p>',
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
                            ref                 :'switcher',
                            autoEl              :{
                                tag                 :'a',
                                cls                 :'switcher',
                                href                :'/',
                                style               :{
                                    position            :'absolute',
                                    left                :'-99999em',
                                    top                 :'-99999em'
                                }
                            },
                            listeners           :{
                                render              :me.initSwitcher,
                                scope               :me
                            }
                        }]
                    }]
                },{
                    xtype               :'dataview',
                    store               :me.contest.prizes(),
                    itemSelector        :'.prize-odds',
                    trackOver           :false,
                    tpl                 :new Ext.XTemplate(
                        '<div class="odds-tables">',
                            '<div class="overview">',
                                '<div class="alternate">{[this.getAlternate()]}</div>',
                            '</div>',
                            '<div class="prizes-odds">',
                                '<table>',
                                    '<tr>',
                                        '<th>Prize Name</th>',
                                        '<th>Quantity</th>',
                                        '<th>Odds per Play</th>',
                                        '<th>Odds per Entry</th>',
                                    '</tr>',
                                    '<tpl for=".">',
                                        '<tr class="prize-odds">',
                                            '<td class="prize-name">{name}</td>',
                                            '<td class="prize-total">{total}</td>',
                                            '<td class="prize-odds-value">',
                                                '{[this.getPrizePlayOdds(xindex)]}',
                                            '</td>',
                                            '<td class="prize-odds-value">',
                                                '{[this.getPrizeOdds(xindex)]}',
                                            '</td>',
                                        '</tr>',
                                    '</tpl>',
                                    '<tr class="footer">',
                                        '<th>Total</th>',
                                        '<td>{[this.totalPrizes()]}</td>',
                                        '<td>{[this.overallPlayOdds()]}</td>',
                                        '<td>{[this.overallEntryOdds()]}</td>',
                                    '</tr>',
                                '</table>',
                            '</div>',
                        '</div>',
                        {
                            getAlternate : function(){
                                if( me.mode=='odds' ){
                                    return '<strong>'+me.contest.get('total_entries')+'</strong> Total Entries';
                                }
                                else{
                                    return '1 in <strong>'+me.contest.get('win_frequency').toFixed(1)+'</strong> Overall Odds';
                                }
                            },
                            
                            totalEntries : function(){
                                return me.contest.get('total_entries').getValue();
                            },
                            
                            totalPlays : function(){
                                return me.contest.getTotalPlays();
                            },
                            
                            totalPrizes : function(){
                                return me.contest.getTotalPrizeCount();
                            },
                            
                            overallPlayOdds : function(){
                                var value = me.contest.getTotalPlays() / me.contest.getTotalPrizeCount();
                                return '1 in '+value.toFixed(1);
                            },
                            
                            overallEntryOdds : function(){
                                var value = me.contest.get('total_entries') / me.contest.getTotalPrizeCount();
                                return '1 in '+value.toFixed(1);
                            },
                            
                            getPrizeOdds : function(index){
                                return me.contest.getPrizeOdds(index-1);
                            },
                            
                            getPrizePlayOdds : function(index){
                                return me.contest.getPrizePlayOdds(index-1);
                            }
                        }
                    )
                }]
            }]
        });
        
        me.callParent(arguments);
        me.intro = me.down('[ref=intro]');
        var delayedUpdate = Ext.Function.createBuffered(me.onStoreUpdate, 10, me);
        me.contest.prizes().on('update', delayedUpdate);
        me.contest.prizes().on('add', delayedUpdate);
        me.contest.prizes().on('remove', delayedUpdate);
        
        me.on('destroy', function(){
            me.contest.prizes().un('update', delayedUpdate);
            me.contest.prizes().un('add', delayedUpdate);
            me.contest.prizes().un('remove', delayedUpdate);
        });
        
        me.on('activate', function(){
            me.updateContest();
            me.hideFields(me.mode=='odds'?'entry':'odds')
            me.showFields(me.mode!='odds'?'entry':'odds')
        });
    },
    
    loadContest : function(){
        var me = this;
        if( me.mode == 'odds' ){
            me.down('[name=win_frequency]').setValue(me.contest.get('win_frequency')||2);
        }
        else{
            me.down('[name=total_entries]').setValue(me.contest.get('total_entries')||500);
        }
        me.down('[name=engine_type]').setValue(me.contest.get('engine_type')||'order');
    },
    
    onEngineChange : function(){
        var me = this;
        var type = me.down('[name=engine_type]').getValue()||'order';
        Ext.each(me.query('[refCls=container]'), function(cmp){cmp.hide()});
        me.down('[ref='+type+'-container]').show();
        me.updateContest();
        me.onFieldFocus();
    },
    
    initSwitcher : function(cmp){
        var me = this;
        cmp.update(me.mode=='odds'?'Switch to<br />Total Entry Mode':'Switch to<br />Average Odds Mode')
        cmp.getEl().on('click', function(e){
            e.preventDefault();
            me.switchMode();
        });
    },
    
    updateContest : function(){
        var me = this;
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
        me.down('dataview').refresh();
    },
    
    onStoreUpdate : function(){
        this.updateContest();
        //this.down('dataview').refresh();
    },
    
    switchMode : function(){
        var me = this;
        me.hideFields(me.mode);
        me.mode = me.mode=='odds'?'entry':'odds';
        me.engine_options.mode = me.mode;
        me.intro.update(me.getIntroHTML());
        me.showFields(me.mode);
        me.down('[ref=switcher]').update(me.mode=='odds'?'Switch to<br />Total Entry Mode':'Switch to<br />Average Odds Mode');
        me.down('dataview').refresh();
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
            field.focus();
        });
    },
    
    onFieldFocus : function(){
        
        var me = this;
        
        var oddsText = [
            'Odds based prize serving ensures that prizes track play.  In other words, the more people are playing, the more prizes go out.',
            '',
            'Your prizes will be distributed on a fixed odds basis shown in the table to the right.  Enter the overall odds that a player wins any prize when they enter this game. Note the effect overall odds have on individual prize odds and the total number of entries. '+
            'Example: If the overall odds are 1 in 4, you would expect that for every four players, on average one will win a prize.',
            '',
            'Your game will end when total entries have been exhausted or the cut-off date selected in step #1 is reached.'
        ];
        
        var timeText = [
            'Time based prize serving ensures that your game will span the selected time period.  The same number of prizes go out regardless of how many people are playing.  Your prizes will be distributed randomly over the time period selected in step #1.',
            '',
            'Example: If you have entered 100 total prizes over a 30 day period, your 100 prizes will be randomly awarded at different points of time within that 30 day period.',
            '',
            'Your game will end when the cut-off date selected in step #1 is reached.'
        ];
        
        me.updateHelpText( (me.down('[name=engine_type]').getValue() == 'order' ? oddsText : timeText).join('<br />') );
    },
    
    onFieldBlur : function(){},
    
    getIntroHTML : function(mode){
        var me = this;
        mode = mode || me.mode;
        return  me[me.mode=='odds'?'oddsText':'entryText'];
    },
    
    validate : function(){
        var me = this;
        if( me.down('[name=engine_type]').getValue() == 'order' && me.contest.get('total_entries') > 1500 ){
            // check page...
            if( !me.up('pagepanel').page.get('name').match(/(bozuko|demo)/i) ){
                return "This contest is too large. The maximum total number of entries is 1,500";
            }
        }
        return true;
    }
    
});