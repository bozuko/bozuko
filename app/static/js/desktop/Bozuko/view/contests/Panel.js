Ext.define('Bozuko.view.contests.Panel', {
    
    alias: 'widget.contestspanel',
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.lib.PubSub',
        'Bozuko.view.contest.List'
    ],
    
    initComponent : function(){
        var me = this;
        
        var tbar = Ext.create('Ext.toolbar.Toolbar',{
            ref         :'contestreport-navbar',
            cls         :'title-toolbar',
            defaults: {
                xtype: 'button',
                scale: 'medium',
                iconAlign: 'left'
            },
            items:[{
                xtype       :'tbtext',
                text        :'All Campaigns'
            }]
        });
        
        if( !Bozuko.beta ){
            tbar.add(' ','-',' ',{
                action          :'create',
                text            :'Create Campaign',
                icon            :"/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/plus-24.png"
            });
        }
        
        if( window.location.hostname.match(/bonobo/) ) tbar.add('-',{
            hidden          :false,
            action          :'builder',
            text            :'Build a Campaign (Beta)',
            icon            :"/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-square-plus-24.png"
        });
        
        Ext.apply(me, {
            bodyCls: 'contestpanel',
            layout : 'card',
            activeItem: 0,
            items : [{
                xtype           :'panel',
                layout          :'fit',
                border          :false,
                tbar            :tbar,
                items :[{
                    xtype           :'contestlist',
                    store           :me.store,
                    autoScroll      :true,
                    actionButtons   :Bozuko.beta?['report']:null
                }]
            }]    
        });
        
        me.callParent(arguments);
    }
});