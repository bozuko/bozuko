Ext.define('Bozuko.view.contest.builder.card.prize.Form', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.contestbuilderprizeform',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            
            layout          :'anchor',
            
            defaults        :{
                xtype           :'textfield',
                labelWidth      :160,
                anchor          :'0'
            },
            
            items: [{
                name                :'name',
                fieldLabel          :'Prize Name',
                emptyText           :'Enter the prize name',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter the prize name. Please try to keep it as short as possible.",
                    '</p>'
                ]
            },{
                name                :'value',
                fieldLabel          :'Prize Value',
                emptyText           :'Enter the value of the prize in USD',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter the value of the prize for tracking purposes.",
                    '</p>'
                ]
            },{
                xtype               :'textarea',
                name                :'description',
                fieldLabel          :'Prize Description',
                emptyText           :'Enter the complete prize description',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "This will be the full prize description that the user can see. You can add any ",
                        "stipulations or restrictions here.",
                    '</p>'
                ]
            },{
                name                :'instructions',
                fieldLabel          :'Redemption Instructions',
                emptyText           :'Enter the complete prize description',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "This will be the full prize description that the user can see. You can add any ",
                        "stipulations or restrictions here.",
                    '</p>'
                ]
            }]
        });
        
        me.callParent(arguments);
    }
    
})