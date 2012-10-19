Ext.define('Bozuko.view.contest.edit.Theme' ,{
    
    extend: 'Ext.tab.Panel',
    alias : 'widget.contestformtheme',
    
    requires: [
        'Bozuko.lib.panel.AceEditor'
    ],
    
    layout: 'anchor',
    autoScroll: true,
    defaults: {
        anchor          :'0',
        labelWidth      :150
    },
    
    initComponent : function(){
        var me = this;
        
        me.defaults = {
            border: false,
            bodyPadding: 0,
            layout: 'fit'
        };
        
        me.bodyPadding = 0;
        
        me.items = [{
            ref                 :'options',
            title               :'Options',
            xtype               :'form',
            layout              :'anchor',
            bodyPadding         :10,
            defaults            :{
                labelWidth          :160
            },
            items               :[{
                xtype               :'fieldset',
                title               :'Common',
                defaults            :{
                    labelWidth          :160,
                    anchor              :'0'
                },
                items               :[{
                    name                :'winCustom',
                    xtype               :'textfield',
                    fieldLabel          :'Win Image'
                },{
                    name                :'loseCustom',
                    xtype               :'textfield',
                    fieldLabel          :'Lose Image'
                },{
                    name                :'playAgainCustom',
                    xtype               :'textfield',
                    fieldLabel          :'Play Again Image'
                },{
                    name                :'freePlayCustom',
                    xtype               :'textfield',
                    fieldLabel          :'Free Play Image'
                }]
            },{
                xtype               :'fieldset',
                title               :'Scratch',
                defaults            :{
                    labelWidth          :160,
                    anchor              :'0'
                },
                items               :[{
                    name                :'no_numbers',
                    xtype               :'checkbox',
                    fieldLabel          :'No Number Scratch Ticket'
                }]
            },{
                xtype               :'fieldset',
                title               :'Slots',
                defaults            :{
                    labelWidth          :160,
                    anchor              :'0'
                },
                items               :[{
                    name                :'slotsFrame',
                    xtype               :'textfield',
                    fieldLabel          :'Slots Frame'
                },{
                    name                :'slotsHideLogo',
                    xtype               :'checkbox',
                    fieldLabel          :'Hide Logo'
                }]
            }]
        },{
            ref                 :'css',
            title               :'CSS (less.js syntax)',
            xtype               :'aceeditor',
            mode                :'less'
        },{
            ref                 :'js',
            title               :'Javascript',
            xtype               :'aceeditor',
            mode                :'javascript'
        }];
        
        me.callParent();
        me.on('activate', me.loadValues, me);
    },
    
    loadRecord : function(record){
        var options = record.get('game_config').theme_options;
        if( options ){
            this.down('[ref=css]').setValue(options.css);
            this.down('[ref=js]').setValue(options.js);
            this.down('[ref=options]').getForm().setValues( options );
        }
    },
    
    getValues : function(){
        
        var v = {};
        Ext.Array.each( this.down('[ref=options]').query('field'), function(cmp){
            v[cmp.name] = cmp.getValue();
        });
        
        return {
            game_config : {
                theme_options: Ext.apply({
                    css : this.down('[ref=css]').getValue(),
                    js : this.down('[ref=js]').getValue()
                }, v)
            }
        };
    }
});