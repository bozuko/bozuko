Ext.define('Bozuko.view.contest.builder.card.Game', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuildergame',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Ext.tip.ToolTip'
    ],
    name            :"Game",
    overview        :[
        "<p>Choose one of our <em>addictively simple</em> games for your campaign!</p>"
    ],
    
    initComponent : function(){
        var me = this;
        me.currentGame = null;
        Ext.apply( me.form, {
            items : [{
                xtype               :'container',
                border              :false,
                arrowCt             :true,
                style               :'position: relative; overflow: visible',
                layout              :{
                    type                :'hbox'
                },
                items               :[{
                    
                    labelAlign          :'top',
                    xtype               :'fieldcontainer',
                    border              :false,
                    layout              :'hbox',
                    flex                :1,
                    autoHeight          :true,
                    fieldLabel          :'Start Date',
                    helpText            :[
                        "<p>",
                            'This is the date and time your game will be available to players in the mobile application.',
                        '</p>'
                    ],
                    
                    items               :[{
                        xtype               :'datefield',
                        name                :'start',
                        allowBlank          :false,
                        format              :'m-d-Y',
                        fieldLabel          :'Start Date',
                        hideLabel           :true,
                        autoHeight          :true,
                        flex                :1,
                        emptyText           :'Start Date of the Campaign',
                        
                        listeners           :{
                            scope               :me,
                            focus               :function(field){
                                if( !field.isExpanded ) field.onTriggerClick();
                            },
                            select              :me.onStartChange
                        }
                    },{xtype:'splitter'},{
                        xtype               :'timefield',
                        name                :'start_time',
                        value               :new Date(2011,1,1,12),
                        editable            :false,
                        allowBlank          :false,
                        hideLabel           :true,
                        autoHeight          :true,
                        flex                :1,
                        increment           :60
                    }]
                },{xtype:'splitter', width: 20},{
                    labelAlign          :'top',
                    xtype               :'fieldcontainer',
                    border              :false,
                    fieldLabel          :'End Date',
                    layout              :'hbox',
                    flex                :1,
                    autoHeight          :true,
                    helpText            :[
                        "<p>",
                            'This is the cut-off date for your game. Your game ends when total entries are exhausted or this date hits.',
                        '</p>'
                    ],
                    
                    items               :[{
                        flex                :1,
                        xtype               :'datefield',
                        name                :'end',
                        allowBlank          :false,
                        format              :'m-d-Y',
                        fieldLabel          :'End Date',
                        hideLabel           :true,
                        autoHeight          :true,
                        listeners           :{
                            scope               :me,
                            focus               :function(field){
                                if( !field.isExpanded ) field.onTriggerClick();
                            },
                            select              :me.onEndChange
                        }
                        
                    },{xtype:'splitter'},{
                        xtype               :'timefield',
                        name                :'end_time',
                        value               :new Date(2011,1,1,12),
                        editable            :false,
                        allowBlank          :false,
                        hideLabel           :true,
                        autoHeight          :true,
                        flex                :1,
                        increment           :60
                    }]
                }]
            },{
                xtype           :'dataview',
                trackOver       :true,
                overItemCls     :'x-dataview-item-over',
                
                cls             :'select-list2 game-list',
                
                emptyText       :'No Games',
                deferEmptyText  :false,
                
                singleSelect    :true,
                itemSelector    :'.x-dataview-item',
                
                tpl             :new Ext.XTemplate(
                    '<div class="games list-items">',
                        '<tpl for=".">',
                            '<div class="game x-dataview-item">',
                                '<input style="position: absolute; left: -99999em;" type="radio" name="focus_field" />',
                                '<img src="{img}" />',
                                '<div class="title">{title}</div>',
                            '</div>',
                        '</tpl>',
                    '</div>',
                    '<div class="entry-description selection-description"></div>'
                ),
                
                store : Ext.create('Ext.data.Store', {
                    fields : ['img','title','description','game'],
                    data : [{
                        game: 'slots',
                        title: 'Slot Machine',
                        img:'/games/slots/slots_icon3.png',
                        description: [
                            "<p>Players spin a slot machine to win prizes. Three icons in a row and they win!</p>"
                        ].join('')
                    },{
                        game: 'scratch',
                        title: 'Scratch Ticket',
                        img:'/games/scratch/themes/default/scratch.png',
                        description: [
                            "<p>Players scratch six positions on a scratch ticket to win prizes. ",
                            "If any three positions match they win! </p>"
                        ].join('')
                    }]
                }),
                
                listeners : {
                    selectionchange     :me.onSelectionChange,
                    scope               :me,
                    refresh             :function(){
                        me.loadGame();
                    },
                    beforecontainerclick:function(){
                        return false;
                    }
                    
                }
            },{
                xtype               :'textfield',
                emptyText           :'Leave blank for default name (Slots, Scratch, etc)',
                ref                 :'game-name',
                name                :'game_config.name',
                fieldLabel          :'Game Name',
                helpText            :[
                    '<p>',
                        'This is the public name of this game.  Have some fun with it!',
                    '</p>',
                    '<p>',
                        'Example: Car Wash Slots',
                    '</p>'
                ]
            },{
                xtype               :'fieldcontainer',
                ref                 :'last-field',
                border              :false,
                fieldLabel          :'Plays per Entry',
                helpText            :[
                    '<p>This is how many times a user can play the game for each entry. ',
                        '<span style="text-decoration:underline;">This does not affect the average odds per player</span>. ',
                        'Use multiple plays to extend the play time or allow players to win multiple prizes.',
                    '</p>',
                    '<p>',
                        'Example 1: A bar may give players 3 spins at a slot machine.<br /><br />',
                        'Example 2: A gas station may give players a single scratch ticket.',
                    '</p>'
                ],
                layout              :'hbox',
                items               :[{
                    xtype               :'combo',
                    ref                 :'last-field',
                    name                :'entry_config.tokens',
                    hideLabel           :true,
                    minValue            :1,
                    maxValue            :20,
                    width               :50,
                    allowBlank          :false,
                    editable            :false,
                    forceSelection      :true,
                    displayField        :'value',
                    valueField          :'value',
                    queryMode           :'local',
                    store               :Ext.create('Ext.data.Store',{
                        fields              :['value'],
                        data                :[{value:1},{value:2},{value:3},{value:4},{value:5}]
                    })
                }]
            },{
                xtype               :'hidden',
                name                :'game_config.custom_background'
            },{
                xtype               :'hidden',
                name                :'game_config.custom_icon'
            }]
        });
        
        me.callParent(arguments);
        me.un('activate', me.focusFirstField, me );
        me.on('activate', me.updateOptions, me);
        me.on('render', me.onStartChange, me);
        me.on('render', me.onEndChange, me);
        me.dataview = me.down('dataview');
    },
    
     
    onStartChange : function(value){
        var me = this;
        
        me.down('datefield[name=end]').setMinValue(me.down('datefield[name=start]').getValue());
    },
    onEndChange : function(value){
        var me = this;
        
        me.down('datefield[name=start]').setMaxValue(me.down('datefield[name=end]').getValue());
    },
    
    
    updateOptions : function(){
        var me = this;
        
        // check for game
        if( me.currentGame == me.contest.get('game') ) return;
        // clear out the old stuff
        var i = me.form.items.indexOf( me.down('[ref=last-field]') );
        while( me.form.items.getCount() > i+1 ){
            me.form.remove( me.form.items.getAt(i+1) );
        }
        // add new stuff
        me.currentGame = me.contest.get('game');
        me.addThemeChooser( me.currentGame );
        // also want to add our custom theme / icon field
        
    },
    
    loadContest : function(){
        var me = this,
            values = {};
        
        me.entry_cfg = me.contest.getEntryConfig(true),
        me.game_cfg = me.contest.get('game_config') || {};
            
        if( me.entry_cfg ){
            for(var i in me.entry_cfg){
                values['entry_config.'+i] = me.entry_cfg[i];
            }
        }
        if( me.game_cfg ){
            for(var i in me.game_cfg){
                values['game_config.'+i] = me.game_cfg[i];
            }
        }
        
        me.form.getForm().setValues(values);
        me.down('[name=start]').setValue(me.contest.get('start'));
        me.down('[name=end]').setValue(me.contest.get('end'));
        me.down('[name=start_time]').setValue(me.contest.get('start'));
        me.down('[name=end_time]').setValue(me.contest.get('end'));
    },
    
    loadGame : function(){
        var me = this,
            game = me.contest.get('game');
        
        if( !game ) return;
        var record = me.dataview.store.findRecord('game', game);
        if( !record ) return;
        me.dataview.select( record );
    },
    
    validate : function(){
        var me = this,
            selected = me.dataview.getSelectionModel().getSelection();
            
        me.updateRecord();
            
        if( !selected.length ){
            return "Please select on the entry types before going to the next step.";
        }
        
        return true;
    },
    
    updateRecord : function(){
        var me = this,
            selections = me.dataview.getSelectionModel().getSelection(),
            values = me.getValues(),
            game = null,
            start_time = me.down('[name=start_time]').getValue(),
            end_time = me.down('[name=end_time]').getValue()
            ;
        
        
        
        if( selections.length ){
            game = selections[0].get('game');
        }
        Ext.apply( me.game_cfg, values.game_config);
        Ext.apply( me.entry_cfg, values.entry_config);
        
        try{
            
            me.contest.set('start', me.down('[name=start]').getValue());
            me.contest.set('end', me.down('[name=end]').getValue());
            
            me.contest.get('start').setHours(start_time.getHours());
            me.contest.get('start').setMinutes(start_time.getMinutes());
            me.contest.get('start').setSeconds(start_time.getSeconds());
            
            me.contest.get('end').setHours(end_time.getHours());
            me.contest.get('end').setMinutes(end_time.getMinutes());
            me.contest.get('end').setSeconds(end_time.getSeconds());
        } catch(e){
            // problem with the dates...
        }
        
        me.contest.set('game_config', me.game_cfg);
        me.contest.set('game', game);
        me.contest.set('name', values.game_config.name+' - '+Ext.Date.format(me.contest.get('start'), 'm-d-Y'));
    },
    
    onSelectionChange : function(view, selections){
        var me = this;
        if( selections.length ){
            me.dataview.getEl().down('.entry-description').update(selections[0].get('description'));
        }
        var r = selections[0];
        var n = me.getValues().game_config.name;
        var same = false;
        view.store.each(function(i){
            if(i.get('title') == n){
                same=true;
                return false;
            }
            return true;
        });
        if( n == '' || same ){
            me.down('[ref=game-name]').setValue(r.get('title'));
        }
        me.updateRecord();
        me.updateOptions();
    },
    
    onThemesLoad : function(store){
        var me = this,
            i = store.find('theme', me.game_cfg.theme );
            
        if(!~i) i = store.find('theme', 'default');
        
        if( ~i ){
            var tc = me.down('[ref=theme-chooser]');
            if( tc ) tc.getSelectionModel().select(i);
        }
        me.doLayout();
    },
    
    addThemeChooser : function(type){
        var me = this;
        
        me.form.add({
            xtype           :'component',
            autoEl          :{
                tag             :'div',
                html            :'Choose a theme:'
            }
        },{
            xtype           :'dataview',
            ref             :'theme-chooser',
            trackOver       :true,
            overItemCls     :'theme-over',
            
            fieldLabel      :'Theme',
            labelAlign      :'top',
            
            cls             :'theme-list',
            
            emptyText       :'No Themes Available',
            deferEmptyText  :false,
            
            singleSelect    :true,
            height          :230,
            
            itemSelector    :'.theme',
            
            tpl         :new Ext.XTemplate(
                '<div class="themes">',
                    '<tpl for=".">',
                        '<div class="theme">',
                            '<div class="theme-content">',
                                '<input style="position: absolute; top: -99999em; left: -99999em;" type="radio" name="focus_field" />',
                                '<div class="title">{title}</div>',
                                '<img src="{[this.getIcon(xindex-1)]}" />',
                                '<div class="description">{description}</div>',
                            '</div>',
                        '</div>',
                    '</tpl>',
                '</div>',
                {
                    getIcon : function(index){
                        var item = me.down('[ref=theme-chooser]').store.getAt(index);
                        if( !(me.contest.get('game') === 'scratch' && item.get('name') === 'custom') ) return item.get('icon');
                        return me.contest.get('game_config').custom_icon || item.get('icon');
                    }
                }
            ),
            
            store : Ext.create('Ext.data.Store', {
                fields : ['title','preview','description','theme','icon'],
                proxy : {
                    type: 'rest',
                    url: Bozuko.Router.route('/themes/'+type+'/'+encodeURIComponent(me.up('pagepanel').page.get('name'))),
                    reader : {
                        type: 'json',
                        root: 'items'
                    }
                },
                autoLoad : true,
                listeners : {
                    scope           :me,
                    load            :me.onThemesLoad
                }
            }),
            
            listeners : {
                beforecontainerclick : function(view, e){
                    return false;
                },
                selectionchange : function(view, records){
                    if( records && records.length){
                        me.game_cfg.theme = records[0].get('theme');
                    }
                },
                render : function(view){
                    view.tip = Ext.create('Ext.tip.ToolTip', {
                        target : view.el,
                        height : 222,
                        width : 172,
                        delegate : view.itemSelector,
                        trackMouse : true,
                        renderTo: Ext.getBody(),
                        listeners : {
                            beforeshow : function updateTipBody(tip){
                                var record = view.getRecord(tip.triggerElement),
                                    preview = record.get('preview');
                                    
                                if(me.contest.get('game') == 'scratch' && record.get('name') == 'custom')
                                    preview = me.contest.get('game_config').custom_background;
                                    
                                tip.update('<img src="'+preview+'" height="210" />');
                            }
                        }
                    });
                }
            }
        });
        
        var dv = me.down('[ref=theme-chooser]');
    }
});