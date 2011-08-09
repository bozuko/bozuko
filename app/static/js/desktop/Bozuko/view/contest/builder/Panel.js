Ext.define( 'Bozuko.view.contest.builder.Panel', {
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.contestbuilder',
    
    cls             :'contest-builder',
    
    requires        :[
        'Bozuko.model.Contest',
        'Bozuko.view.contest.builder.Preview',
        'Bozuko.view.contest.builder.card.General',
        'Bozuko.view.contest.builder.card.Entry',
        'Bozuko.view.contest.builder.card.Game',
        'Bozuko.view.contest.builder.card.GameOptions',
        'Bozuko.view.contest.builder.card.Prizes'
    ],
    
    initComponent : function(){
        var me = this;
        
        // create a new contest with the defaults
        if( !me.contest ){
            me.contest = new Bozuko.model.Contest();
            me.contest.data = {};
        }
        
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
            layout              :'border',
            defaults            :{
                border              :false
            },
            items               :[{
                region              :'center',
                layout              :'card',
                activeItem          :0,
                defaults            :{
                    border              :false,
                    contest             :me.contest
                },
                items: [{
                    xtype               :'contestbuilderprizes'
                },{
                    xtype               :'contestbuildergeneral'
                },{
                    xtype               :'contestbuilderentry'
                },{
                    xtype               :'contestbuildergame'
                },{
                    xtype               :'contestbuildergameoptions'
                }]
            },{
                xtype               :'contestbuilderpreview',
                width               :230,
                region              :'east',
                contest             :me.contest
            }]
        });
        me.callParent(arguments);
        
        // now that all the display elements are in there,
        // lets take a peak and initialize our stuff
        
        me.preview = me.down('contestbuilderpreview');
        me.stepToolbar = me.down('toolbar[ref=steps]');
        me.centerPanel = me.down('[region=center]');
        
        me.centerPanel.items.each(function(card, i){
            
            if( card.addNavigationButtons ){
                var buttons = [];
                if( i > 0 ) buttons.push('back');
                if( i !== me.centerPanel.items.getCount()-1 ) buttons.push('next');
                else buttons.push('finish');
                card.addNavigationButtons( buttons );
            }
            
            // add step to our toolbar
            me.stepToolbar.add({
                text: (i+1)+'. '+card.name,
                disabled: i!==0,
                toggled: i===0,
                handler: function(){
                    me.goToCard(i);
                }
            });
            
            card.on('activate', me.onCardActivate, me);
            card.on('back', me.back, me);
            card.on('next', me.next, me);
            card.on('finish', me.finish, me);
        });
        
        me.stepButtons = me.stepToolbar.query('button');
    },
    
    onCardActivate : function(card){
        var me = this,
            index = me.centerPanel.items.indexOf(card);
        
        Ext.Array.each( me.stepButtons, function(stepBtn, i){
            if( i <= index ){
                stepBtn.setDisabled(false);
            }
            stepBtn.toggle( i === index );
        });
    },
    
    currentStep : function(){
        var me = this;
        return me.centerPanel.items.indexOf( me.activeCard() );
    },
    
    activeCard : function(){
        var me = this;
        return me.centerPanel.getLayout().getActiveItem();
    },
    
    next : function(btn){
        var me = this;
        me.goToCard( me.currentStep()+1 );
        
    },
    back : function(btn){
        var me = this
        // TODO validate the current card
        
        me.goToCard( me.currentStep()-1 );
        
    },
    finish : function(btn){
        var me = this,
            index = me.currentStep();
    },
    goToCard : function(index){
        var me = this, valid;
        
        // validate current card
        if( me.currentStep() < index && (valid = me.activeCard().validate())!==true ){
            var title, message, defaultTitle = 'Uh-oh';
            
            if( Ext.isObject(valid) ){
                title = valid.title||defaultTitle;
                message = valid.message;
            }
            else if( Ext.isString(valid) ){
                title = defaultTitle;
                message = valid;
            }
            if( !valid ){
                title = defaultTitle;
                message = 'Please fix the errors on the form before moving on to the next step';
            }
            Ext.Msg.alert(title, message);
            return;
        }
        
        me.centerPanel.getLayout().setActiveItem( index );
    }
});