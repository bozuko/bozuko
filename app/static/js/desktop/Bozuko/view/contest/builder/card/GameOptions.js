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
                xtype               :'textfield',
                name                :'entry_config.tokens',
                fieldLabel          :'Plays per Entry',
                description         :[
                    '<p>This is how many times a user can play the game for each entry. ',
                    'This will not affect overall odds of the contest. If you business is a restaurant or bar, ',
                    'you may want to consider offering 4 or 5... need more copy.',
                    '</p>'
                ]
            }]
        });
        
        me.callParent(arguments);
    }
});