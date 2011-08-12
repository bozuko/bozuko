Ext.define('Bozuko.view.contest.builder.card.Odds', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderodds',
    
    requires        :[
        'Bozuko.view.contest.builder.Card'
    ],
    name            :"Contest Odds",
    overview        :[
        "<p>Configure the Entry totals here.</p>"
    ],

    initComponent : function(){
        var me = this;
        
        Ext.apply(me.form, {
            items               :[{
                name                :'win_frequency',
                fieldLabel          :'Win Frequency',
                allowBlank          :false,
                helpText            :[
                    
                ]
            }]
        });
        
        me.callParent(arguments);
    }
    
    
});