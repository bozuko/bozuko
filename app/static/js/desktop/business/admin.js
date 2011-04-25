Ext.define('Bozuko.form.field.Game', {
    extend : 'Ext.form.field.Radio',
    alias: 'widget.gamefield',
    hideLabel: true,
    fieldSubTpl: [
        '<div class="game-choice">',
            '<input type="radio" id="{id}" name="{name}" ',
                '<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
                'class="{fieldCls} {typeCls}" />',
            '<div class="game-ct">',
                '<tpl if="game">',
                    '<div class="game-image"><img class="game-image" src="{game.image}" /></div>',
                    '<div class="game-name">{game.name}</div>',
                    '<div class="game-description">{game.description}</div>',
                '</tpl>',
            '</div>',
        '</div>',
        {
            compiled: true,
            disableFormats: true
        }
    ],
    
    getSubTplData : function(){
        var me = this;
        Ext.applyIf( me.subTplData, {
            game: this.game
        });
        return this.callParent();
    },
    
    initComponent : function(){
        var me = this,
            renderSelectors = me.renderSelectors,
            afterRenderEvents = me.afterRenderEvents;
        
        Ext.applyIf(renderSelectors, {
            gameCt : '.game-choice'
        });
        
        this.callParent();
        
    },
    afterRender : function(){
        var me = this;
        me.callParent();
        me.gameCt.addClsOnOver('game-choice-over');
        me.gameCt.addClsOnClick('game-choice-click');
        me.gameCt.on('click',  function(){
            me.setValue(true);
        });
        me.on('change',function(){
            me.gameCt[(me.checked?'add':'remove')+'Cls']('game-choice-selected');
        });
    },
    
    setRawValue : function(value){
        var me = this;
        me.callParent([value]);
        if( me.checked ){
            me.inputEl.dom.checked = true;
        }
    }
});

Ext.define('Bozuko.form.Prizes', {
    extend: 'Ext.panel.Panel',
    requires: ['Ext.form.Field'],
    
    initComponent : function(){
        var me = this;
        
        
        
        me.callParent();
    }
});

Ext.define('Bozuko.view.campaign.Builder', {
    
    extend: 'Ext.form.FormPanel',
    
    requires: ['Ext.tab.TabPanel'],

    title: "Create Campaign",
    
    plain: true,
    
    constructor : function(config){
        
        var me = this;
        me.tabPanel = Ext.create('Ext.tab.TabPanel',{
            region: 'center',
            plain: true,
            activeTab: 0,
            defaults: {
                autoScroll: true,
                padding: 10,
                disabled: true,
                layout: 'anchor'
            },
            items: [
                {
                    title: "1. Choose a Game",
                    disabled: false,
                    xtype: 'panel',
                    layout: {
                        type: 'anchor'
                    },
                    
                    defaults: {
                        xtype: 'gamefield',
                        anchor: '0',
                        listeners : {
                            change : function(){
                                me.enableNext();
                                me.goToNext();
                            }
                        }
                    },
                    items: [{
                        xtype: 'component',
                        html: '<p style="margin-bottom: 10px">Select the game for your campaign below.</p>'
                    },{
                        name: 'game',
                        game:{
                            name: 'Slot Machine',
                            description: 'Slot Machine Description',
                            image: '/games/slots/slots-admin.png'
                        }
                    },{
                        name: 'game',
                        game:{
                            name: 'Scratch Ticket',
                            description: 'Scratch Ticket Description',
                            image: '/games/scratch/scratch-admin.png'
                        }
                    }]
                },{
                    title: "2. Add the Prizes"
                },{
                    title: "3. Choose Entry Methods"
                },{
                    title: "4. Set Campaign Timeline"
                },{
                    title: "5. Rules"
                },{
                    title: "6. Publish Campaign"
                }
            ]
        });
        
        // add our items
        Ext.apply(config,{
            border: false,
            layout: 'border',
            frame: true,
            buttons: ['->',{
                xtype: 'button',
                scale: 'medium',
                text: 'Next'
            }],
            items: [{
                region: 'west',
                width: 240,
                bodyPadding: 10,
                padding: '0 5 0 0',
                html: 'Progress Widget'
            },this.tabPanel]
        });
        
        this.callParent([config]);
        return this;
    },
    
    enableNext : function(){
        var next = this.tabPanel.getLayout().getNext();
        next.enable();
    },
    
    goToNext : function(){
        this.tabPanel.next();
    }
});

Ext.onReady(function(){
    window.builder = Ext.create('Bozuko.view.campaign.Builder', {
        height: 500,
        renderTo: 'business-admin'
    });
});

