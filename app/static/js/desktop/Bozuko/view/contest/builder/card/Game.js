Ext.define('Bozuko.view.contest.builder.card.Game', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuildergame',
    
    requires        :[
        'Bozuko.view.contest.builder.Card'
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
                                '<input style="position: absolute; top: -99999em; left: -99999em;" type="radio" name="focus_field" />',
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
                        img:'/images/desktop/app/builder/games/slot-machine.png',
                        description: [
                            "<p>A simple slot machine. Your logo will be prominent on the face of the machine. ",
                            "There are several themes to choose from. You can also upload your own icons to be used on ",
                            "each slot wheel.</p>"
                        ].join('')
                    },{
                        game: 'scratch',
                        title: 'Scratch Ticket',
                        img:'/images/desktop/app/builder/games/scratch-ticket.png',
                        description: [
                            "<p>A simple Scratch Ticket. Your logo will be featured in the top left. ",
                            "There are several themes to choose from, or you can upload your own background image (coming soon).</p>"
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
                name                :'game_config.name',
                fieldLabel          :'Game Name',
                helpText            :[
                    '<p>This will be displayed to the user. You can make this whatever you want, just try to keep ',
                    'it pretty short.',
                    '</p>'
                ]
            },{
                xtype               :'fieldcontainer',
                ref                 :'last-field',
                border              :false,
                fieldLabel          :'Plays per Entry',
                layout              :'hbox',
                items               :[{
                    xtype               :'numberfield',
                    ref                 :'last-field',
                    name                :'entry_config.tokens',
                    hideLabel           :true,
                    minValue            :1,
                    maxValue            :20,
                    width               :50,
                    allowBlank          :false,
                    regexText           :'Please enter a number greater than zero',
                    helpText            :[
                        '<p>This is how many times a user can play the game for each entry. ',
                        'This will not affect overall odds of the contest. If you business is a restaurant or bar, ',
                        'you may want to consider offering 4 or 5... need more copy.',
                        '</p>'
                    ]
                }]
            }]
        });
        
        me.callParent(arguments);
        me.on('activate', me.updateOptions, me);
        me.dataview = me.down('dataview');
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
                values['game_config.'+i] = me.entry_cfg[i];
            }
        }
        
        me.form.getForm().setValues(values);
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
            
        if( !selected.length ){
            return "Please select on the entry types before going to the next step.";
        }
        
        return true;
    },
    
    updateRecord : function(){
        var me = this,
            selections = me.dataview.getSelectionModel().getSelection(),
            values = me.getValues(),
            game = null;
        
        if( selections.length ){
            game = selections[0].get('game');
        }
        Ext.apply( me.game_cfg, values.game_config);
        Ext.apply( me.entry_cfg, values.entry_config);
        
        me.contest.set('game_config', me.game_cfg);
        me.contest.set('game', game);
    },
    
    onSelectionChange : function(view, selections){
        var me = this;
        if( selections.length ){
            me.dataview.getEl().down('.entry-description').update(selections[0].get('description'));
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
            
            cls             :'select-list theme-list',
            
            emptyText       :'No Themes Available',
            deferEmptyText  :false,
            
            singleSelect    :true,
            height          :230,
            
            itemSelector    :'.theme',
            
            tpl         :new Ext.XTemplate(
                '<div class="theme-scroller">',
                    '<table><tr valign="bottom">',
                        '<tpl for=".">',
                            '<td>',
                                '<div class="theme">',
                                    '<input style="position: absolute; top: -99999em; left: -99999em;" type="radio" name="focus_field" />',
                                    '<div class="title">{title}</div>',
                                    '<img src="{preview}" />',
                                    '<div class="description">{description}</div>',
                                '</div>',
                            '</td>',
                        '</tpl>',
                    '</tr></table>',
                '</div>'
            ),
            
            store : Ext.create('Ext.data.Store', {
                fields : ['title','preview','description','theme'],
                proxy : {
                    type: 'rest',
                    url: Bozuko.Router.route('/themes/'+type),
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
                }
            }
        });
        
        var dv = me.down('[ref=theme-chooser]');
    }
});