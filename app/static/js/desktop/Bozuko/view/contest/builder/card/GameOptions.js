Ext.define('Bozuko.view.contest.builder.card.GameOptions', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuildergameoptions',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Bozuko.lib.form.field.Duration',
        'Bozuko.lib.Router'
    ],
    name            :"Options",
    overview        :[
        "<p>Its your game, set it up however you like!</p>"
    ],
    
    initComponent : function(){
        var me = this;
        me.currentGame = null;
        Ext.apply( me.form, {
            items : [{
                xtype               :'textfield',
                name                :'entry_config.tokens',
                fieldLabel          :'Plays per Entry',
                emptyText           :'Please enter a number',
                allowBlank          :false,
                regex               :/^[0-9]+$/,
                maskRe              :/[0-9]/,
                regexText           :'Please enter a number greater than zero',
                helpText            :[
                    '<p>This is how many times a user can play the game for each entry. ',
                    'This will not affect overall odds of the contest. If you business is a restaurant or bar, ',
                    'you may want to consider offering 4 or 5... need more copy.',
                    '</p>'
                ]
            },{
                xtype               :'duration',
                name                :'entry_config.duration',
                fieldLabel          :'Users can play every',
                emptyText           :'Please enter a number',
                helpText            :[
                    '<p>This is how often you will allow a user to play your game. The more frequent, the faster ',
                    'your contest will go.',
                    '</p>'
                ]
            },{
                xtype               :'textfield',
                ref                 :'last-field',
                emptyText           :'Leave blank for default name (Slots, Scratch, etc)',
                name                :'game_config.name',
                fieldLabel          :'Game Name',
                helpText            :[
                    '<p>This will be displayed to the user. You can make this whatever you want, just try to keep ',
                    'it pretty short.',
                    '</p>'
                ]
            }]
        });
        me.callParent(arguments);
        me.on('activate', me.onActivate, me);
        
    },
    
    onActivate : function(){
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
        
        me.entry_cfg = me.contest.getEntryConfig() || {},
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
        
        console.log(values);
        
        me.form.getForm().setValues(values);
    },
    
    updateRecord : function(){
        var me = this,
            values = me.getValues();
            
        Ext.apply( me.game_cfg, values.game_config);
        Ext.apply( me.entry_cfg, values.entry_config);
        
        me.contest.set('game_config', me.game_cfg);
        me.contest.set('entry_config', [me.entry_config]);
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
                }
            }
        });
    }
});