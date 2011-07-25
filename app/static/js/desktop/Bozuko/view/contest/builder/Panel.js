Ext.define( 'Bozuko.view.contest.builder.Panel', {
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.contestbuilder',
    
    requires        :[
        'Bozuko.model.Contest'
    ],
    
    initComponent : function(){
        var me = this;
        
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
                text        :'Campaign Builder'
            }]
        });
        
        Ext.apply(me,{
            layout              :'card',
            activeItem          :0,
            items               :[{
                html: 'first page'
            }]
        });
        me.callParent(arguments);
    }
    
    
});