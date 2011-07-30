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
        
        Ext.apply( me.form, {
            items : [{
                xtype           :'dataview',
                trackOver       :true,
                overItemCls     :'x-dataview-item-over',
                
                cls             :'select-list game-list',
                
                emptyText       :'No Games',
                deferEmptyText  :false,
                
                singleSelect    :true,
                
                itemTpl         :new Ext.XTemplate(
                    '<div class="game">',
                        '<img src="{img}" />',
                        '<div class="game-body">',
                            '<div class="title">{title}</div>',
                            '<div class="description">{description}</div>',
                        '</div>',
                    '</div>'
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
                    }
                }
            }]
        });
        
        me.callParent(arguments);
        me.dataview = me.down('dataview');
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
            game = null;
        
        if( selections.length ){
            game = selections[0].get('game');
        }
        me.contest.set('game', game);
    },
    
    onSelectionChange : function(view, selections){
        var me = this;
        me.updateRecord();
    }
});