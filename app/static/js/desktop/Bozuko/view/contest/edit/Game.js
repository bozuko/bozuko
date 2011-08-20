Ext.define('Bozuko.view.contest.edit.Game' ,{
    
    extend: 'Ext.form.Panel',
    alias : 'widget.contestformgame',
    
    requires: [],
    
    layout: 'anchor',
    defaults: {
        anchor          :'0',
        labelWidth      :150
    },
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'combo',
            name            :'game',
            fieldLabel      :'Game',
            forceSelection  :true,
            editable        :false,
            value           :'slots',
            queryMode       :'local',
            store           :Ext.create('Ext.data.Store',{
                fields:['value', 'text'],
                data:[
                    {value:'slots',text:'Slots'},
                    {value:'scratch',text:'Scratch'}
                ]
            }),
            displayField    :'text',
            valueField      :'value',
            listeners       :{
                scope           :me,
                change          :me.onGameChange
            }
        },{
            xtype           :'textfield',
            name            :'game_config.name',
            fieldLabel      :'Custom Name (leave blank for default)'
        },{
            xtype           :'combo',
            name            :'free_play_pct',
            fieldLabel      :'Free Plays',
            value           :'30%',
            queryMode       :'local',
            editable        :false,
            forceSelection  :true,
            store           :Ext.create('Ext.data.Store',{
                fields:['value', 'text'],
                data:[
                    {value:0,text:'None'},
                    {value:10,text:'10%'},
                    {value:20,text:'20%'},
                    {value:30,text:'30%'},
                    {value:40,text:'40%'},
                    {value:50,text:'50%'},
                    {value:60,text:'60%'}
                ]
            }),
            displayField    :'text',
            valueField      :'value'
        }];
        me.callParent();
        me.on('activate', function(){
            me.onGameChange(me.down('[name=game]'), me.getForm().getRecord().get('game'));
        });
    },
    
    onGameChange : function(field, value){
        var i = this.items.indexOf( this.down('[name=free_play_pct]') ),
            cmp,
            me = this
            ;
            
        while( (cmp = this.items.getAt(i+1)) ) this.remove(cmp);
        // update with the proper config form items
        switch( value ){
            case 'slots':
                this.add({
                    xtype           :'combo',
                    name            :'game_config.theme',
                    fieldLabel      :'Theme',
                    forceSelection  :true,
                    editable        :false,
                    queryMode       :'local',
                    value           :'default',
                    store           :Ext.create('Ext.data.Store',{
                        fields:['value', 'text'],
                        data:[
                            {value:'default',text:'Default'},
                            {value:'mexican_theme',text:'Mexican'},
                            {value:'seadog',text:'Seadog'},
                            {value:'alt',text:'Alternate'}
                        ]
                    }),
                    displayField    :'text',
                    valueField      :'value',
                    value           :'default'
                });
                break;
            
            case 'scratch':
                this.add({
                    xtype           :'combo',
                    name            :'game_config.theme',
                    fieldLabel      :'Theme',
                    forceSelection  :true,
                    editable        :false,
                    queryMode       :'local',
                    value           :'default',
                    store           :Ext.create('Ext.data.Store',{
                        fields:['value', 'text'],
                        data:[
                            {value:'default',text:'Default'},
                            {value:'rock',text:'Rock'},
                            {value:'custom',text:'Custom'}
                        ]
                    }),
                    displayField    :'text',
                    valueField      :'value',
                    value           :'default',
                    listeners       :{
                        scope           :me,
                        change          :function(field, value){
                            var fn = 'custom' === value ? 'show' : 'hide';
                            var bg = me.down('textfield[name=game_config.custom_background]');
                            var icon = me.down('textfield[name=game_config.custom_icon]');
                            Ext.Array.each([bg,icon], function(field){
                                field[fn]();
                                field[fn==='show'?'enable':'disable']();
                            });
                        }
                    }
                },{
                    xtype           :'textfield',
                    name            :'game_config.custom_background',
                    fieldLabel      :'Custom Background',
                    hidden          :true
                },{
                    xtype           :'textfield',
                    name            :'game_config.custom_icon',
                    fieldLabel      :'Custom Icon',
                    hidden          :true
                });
                break;
        }
        
        var config = this.getForm().getRecord().get('game_config');
        var v = {};
        for(var p in config){
            v['game_config.'+p] = config[p];
        }
        this.getForm().setValues(v);
    }
    
    
    
});