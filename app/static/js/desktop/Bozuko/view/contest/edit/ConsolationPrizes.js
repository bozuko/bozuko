Ext.define('Bozuko.view.contest.edit.ConsolationPrizes' ,{
    
    extend: 'Bozuko.view.contest.edit.Prizes',
    alias : 'widget.contestformconsolationprizes',
    
    initComponent : function(){
        var me = this;
        
        me.callParent(arguments);
        
        me.insert(0, {
            xtype: 'panel',
            layout: 'anchor',
            border: false,
            items:[{
                xtype: 'fieldset',
                title: 'Consolation Configuration',
                defaults: {
                    anchor: '0',
                    labelWidth: 220
                },
                items:[{
                    xtype: 'checkbox',
                    name: 'enabled',
                    fieldLabel: 'Enable Consolation Prizes'
                },{
                    xtype: 'combo',
                    name: 'who',
                    fieldLabel: 'Which players should recieve?',
                    store           :Ext.create('Ext.data.Store',{
                        fields:['value', 'text'],
                        data:[
                            {value:'all',text:'All players'},
                            {value:'losers',text:'Only players that lost'}
                        ]
                    }),
                    displayField    :'text',
                    valueField      :'value'
                },{
                    xtype: 'combo',
                    name: 'when',
                    fieldLabel: 'When should players receive?',
                    store           :Ext.create('Ext.data.Store',{
                        fields:['value', 'text'],
                        data:[
                            {value:'always',text:'Players receive a consolation prize with every entry'},
                            {value:'once',text:'Players will only receive one consolation per contest'},
                            {value:'interval',text:'At the given interval below'}
                        ]
                    }),
                    displayField    :'text',
                    valueField      :'value'
                },{
                    xtype: 'duration',
                    name: 'duration',
                    fieldLabel: 'Interval (only when above is interval)'
                }]
            }]
        });
    }
});