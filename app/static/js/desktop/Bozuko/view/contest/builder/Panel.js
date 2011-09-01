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
        'Bozuko.view.contest.builder.card.Prizes',
        'Bozuko.view.contest.builder.card.Odds',
        'Bozuko.view.contest.builder.card.Review'
    ],
    
    initComponent : function(){
        var me = this;
        
        // create a new contest with the defaults
        if( !me.contest ){
            me.contest = new Bozuko.model.Contest({
                name: '',
                engine_type: 'order',
                engine_mode: 'odds',
                auto_rules: true,
                free_play_pct: 20,
                consolation_config: {},
                consolation_prizes: [],
                post_to_wall: true
            });
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
                    xtype               :'contestbuildergeneral'
                },{
                    xtype               :'contestbuilderentry'
                },{
                    xtype               :'contestbuildergame'
                },{
                    xtype               :'contestbuilderprizes'
                },{
                    xtype               :'contestbuilderodds'
                },{
                    xtype               :'contestbuilderreview'
                }]
            },{
                xtype               :'contestbuilderpreview',
                width               :230,
                region              :'east',
                contest             :me.contest,
                builder             :me
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
                if( i !== me.centerPanel.items.getCount()-1 ){
                    if( me.contest.get('_id') ){
                        buttons.push('save');
                        if( !me.contest.get('active') ){
                            // buttons.push('publish');
                        }
                    }
                    buttons.push('next');
                }
                else{
                    // this is the last card... lets add the approriate buttons
                    if( me.contest.get('active') ){
                        buttons.push('save');
                    }
                    else{
                        buttons.push('save-draft');
                        buttons.push('publish');
                    }
                    //buttons.push('finish');
                }
                card.addNavigationButtons( buttons );
            }
            
            // add step to our toolbar
            
            var isNew = !me.contest.get('_id');
            
            me.stepToolbar.add({
                text: (i+1)+'. '+card.name,
                disabled: isNew ? i!==0 : false,
                toggled: i===0,
                handler: function(){
                    me.goToCard(i);
                }
            });
            
            card.on('activate', me.onCardActivate, me);
            card.on('back', me.back, me);
            card.on('next', me.next, me);
            card.on('finish', me.finish, me);
            card.on('save', me.save, me);
            card.on('publish', me.publish, me);
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
    validate : function(){
        var me = this,
            valid = true;
        // check each card to see if it validates
        me.centerPanel.items.each(function(card, i){
            valid = card.validate();
            if( valid !== true ){
                
                me.goToCard(i);
                
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
                    message = 'Please fix the errors on the form before saving';
                }
                Ext.Msg.alert(title, message);
                return false;
            }
            return true;
        });
        return valid === true;
    },
    save : function(){
        if( this.validate() ){
            this.fireEvent('save', this);
        }
    },
    publish : function(){
        if( this.validate() ){
            this.fireEvent('publish', this);
        }
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
        me.preview.onContestModify();
    }
});