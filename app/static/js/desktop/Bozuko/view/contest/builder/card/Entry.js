Ext.define('Bozuko.view.contest.builder.card.Entry', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderentry',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Bozuko.lib.form.field.Duration'
    ],
    name            :"Entry Method",
    overview        :[
        "<p>This is the requirement for users to enter your game.  Each entry type has ",
        "unique benefits for your business.  Select an entry method to learn more.</p>"
    ],
    
    initComponent : function(){
        var me = this;
        
        var like_id = Ext.id();
        
        Ext.apply( me.form, {
            items : [{
                xtype           :'dataview',
                trackOver       :true,
                overItemCls     :'x-dataview-item-over',
                
                itemSelector    :'.entry-method',
                
                cls             :'select-list2 entry-list',
                
                emptyText       :'No Entry Methods',
                deferEmptyText  :false,
                
                singleSelect    :true,
                
                tpl             :new Ext.XTemplate(
                    '<div class="entry-methods list-items">',
                        '<tpl for=".">',
                            '<div class="entry-method x-dataview-item">',
                                '<input style="position: absolute; left: -99999em;" type="radio" name="focus_field" />',
                                '<img src="{img}" />',
                                '<div class="title">{title}</div>',
                            '</div>',
                        '</tpl>',
                    '</div>',
                    '<div class="entry-description selection-description"></div>'
                ),
                
                store : Ext.create('Ext.data.Store', {
                    fields : ['img','title','description','type','options'],
                    data : [{
                        type: 'facebook/checkin',
                        title: 'Facebook Check in',
                        img:'/images/desktop/app/builder/entry/facebook-checkin-fit.png',
                        description: [
                            '<p>A player must be present at your location and all entries post to player\'s walls.  Using the Bozuko app, players can "check in and play" with a single button.</p>'
                        ].join(''),
                        options: [
                            '<input type="checkbox" name="enable_like" id="',like_id,'" value="true" /> ',
                            '<label for="',like_id,'">Enable Bonus Plays if the user likes your Facebook Page</label>'
                        ].join('')
                    },{
                        type: 'facebook/like',
                        title: 'Facebook Like',
                        img:'/images/desktop/app/builder/entry/facebook-like-fit.png',
                        description: [
                            '<p>A player must first Facebook "Like" your business on in order to play the game.  The Bozuko application makes Liking your business easy by presenting the user an integrated Like button on your game page.</p>'
                        ].join('')
                    },{
                        type: 'bozuko/checkin',
                        title: 'Bozuko Check in',
                        img:'/images/desktop/app/builder/entry/bozuko-checkin-fit.png',
                        description: [
                            "<p>A user must be at your location to play the game.</p>"
                        ].join('')
                    },{
                        type: 'bozuko/nothing',
                        title: 'No Requirement',
                        img:'/images/desktop/app/builder/entry/bozuko-play-fit.png',
                        description: [
                            "<p>There is no requirement on players outside of play frequency.</p>"
                        ].join('')
                    }]
                }),
                
                listeners : {
                    selectionchange     :me.onSelectionChange,
                    scope               :me,
                    render              :me.watchOptions,
                    refresh             :function(){
                        me.watchOptions();
                        me.loadEntry();
                    },
                    beforecontainerclick:function(){
                        return false;
                    }
                }
            },{
                xtype               :'duration',
                name                :'entry_config.duration',
                fieldLabel          :'Users can play every',
                emptyText           :'Please enter a number',
                helpLabel           :'Play Frequency',
                helpText            :[
                    '<p>How often are players allowed to enter the game?</p>'
                ]
            }]
        });
        
        me.callParent(arguments);
        me.dataview = me.down('dataview');
    },
    
    loadContest : function(){
        var me = this,
            values = {},
            cfg = me.contest.getEntryConfig(true);
            
        for(var i in cfg){
            values['entry_config.'+i] = cfg[i];
        }
        me.form.getForm().setValues(values);
    },
    
    loadEntry : function(){
        var me = this,
            cfg = me.contest.getEntryConfig();
        
        if( !cfg ) return;
        var record = me.dataview.store.findRecord('type', cfg.type);
        if( !record ) return;
        me.dataview.select( record );
        
        var node = me.dataview.getNode( record ),
            options = Ext.fly(node).select('input');
        
        options.each(function(opt){
            var value = cfg.options[opt.getAttribute('name')];
            if( opt.getAttribute('type') == 'checkbox' ){
                opt.checked = value;
            }
            else{
                opt.value = value;
            }
        });
        
    },
    
    watchOptions : function(){
        var me = this;
        me.dataview.getEl().select('.options input').on('change', me.updateRecord, me);
        /*
        me.dataview.getEl().select('.focus-field').on('focus', function(field){
            Ext.fly(field).up('.x-dataview-item').focus();
        });
        me.dataview.getEl().select('.focus-field').on('blur', function(field){
            Ext.fly(field).up('.x-dataview-item').blur();
        });
        */
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
            values = me.getValues(),
            selections = me.dataview.getSelectionModel().getSelection(),
            config = me.contest.getEntryConfig(true);
        
        if( !selections.length ){
            config.type = '';
        }
        else{
            config.type = selections[0].get('type');
            config.options = {};
            
            var node = me.dataview.getNode( selections[0] ),
                options = Ext.fly(node).select('input');

            options.each(function(opt){
                var value;
                if( opt.getAttribute('name') == 'focus_field' ) return;
                if( opt.getAttribute('type') == 'checkbox' ){
                    value = opt.dom.checked;
                }
                else{
                    value = opt.getValue();
                }
                config.options[opt.getAttribute('name')] = value;
            });
        }
        config.duration = me.form.down('[name=entry_config.duration]').getValue();
    },
    
    onSelectionChange : function(view, selections){
        var me = this;
        /*
        me.dataview.getEl().select('.options').setStyle('display', 'none');
        if( selections.length ){
            var node = me.dataview.getNode( selections[0] );
            Ext.fly(node).down('.options').setStyle('display', 'block');
        }
        */
        if( selections.length ){
            me.dataview.getEl().down('.entry-description').update(selections[0].get('description'));
        }
        me.updateRecord();
    }
});