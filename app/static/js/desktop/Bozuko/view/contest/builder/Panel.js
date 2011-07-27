Ext.define( 'Bozuko.view.contest.builder.Panel', {
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.contestbuilder',
    
    cls             :'contest-builder',
    
    requires        :[
        'Bozuko.model.Contest',
        'Bozuko.view.contest.builder.General'
    ],
    
    initComponent : function(){
        var me = this;
        
        // create a new contest with the defaults
        me.contest = new Bozuko.model.Contest();
        
        me.dockedItems = [{
            xtype       :'toolbar',
            dock        :'top',
            ref         :'contestform-navbar',
            cls         :'title-toolbar',
            defaults: {
                xtype: 'button',
                scale: 'medium',
                iconAlign: 'left'
            },
            items:[{
                text        :'Back',
                action      :'back',
                icon        :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-left-24.png'
            },' ',{
                xtype       :'tbtext',
                ref         :'edit-campaign-text',
                text        :'Build a Campaign'
            }]
        },{
            ref         :'steps',
            xtype       :'toolbar',
            dock        :'top',
            defaults    :{
                scale       :'medium'
            },
            items       :[]
        }];
        
        Ext.apply(me,{
            layout              :'card',
            activeItem          :0,
            defaults            :{
                border              :false
            },
            items               :[{
                xtype               :'contestbuildergeneral'
            },{
                xtype               :'contestbuildergeneral'
            }]
        });
        me.callParent(arguments);
        
        // now that all the display elements are in there,
        // lets take a peak and initialize our stuff
        
        me.cards = me.query('contestbuildercard');
        me.stepToolbar = me.down('toolbar[ref=steps]');
        
        Ext.Array.each( me.cards, function(card, i){
            
            var buttons = ['->'];
            
            if( i > 0 ) buttons.push({
                text: 'Back'
            });
            
            if( i === me.cards.length-1 ) buttons.push({
                text: 'Finish',
                style: 'margin-right: 0'
            });
            
            else buttons.push({
                text: "Next",
                style: 'margin-right: 0'
            });
            
            card.form.add({
                xtype           :'toolbar',
                ui              :'footer',
                defaults        :{
                    minWidth        :80,
                    scale           :'medium'
                },
                items           :buttons
            });
            
            // add step to our toolbar
            me.stepToolbar.add({
                text: (i+1)+'. '+card.name
            })
        });
        
        
    }
    
    
});