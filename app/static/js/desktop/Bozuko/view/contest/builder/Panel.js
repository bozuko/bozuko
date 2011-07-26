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
        
        me.tbar = Ext.create('Ext.toolbar.Toolbar',{
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
        });
        
        Ext.apply(me,{
            layout              :'card',
            activeItem          :0,
            defaults            :{
                border              :false
            },
            items               :[{
                xtype               :'contestbuildergeneral'
            }]
        });
        me.callParent(arguments);
    }
    
    
});