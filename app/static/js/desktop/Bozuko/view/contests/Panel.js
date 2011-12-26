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
                text        :'All Games'
            }]
        });

        tbar.add('-',{
            hidden          :false,
            action          :'builder',
            text            :'Create a Game',
            icon            :"/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/plus-24.png"
        });

        Ext.apply(me, {
            bodyCls: 'contestpanel',
            layout : 'card',
            activeItem: 0,
            items : [{
                xtype           :'panel',
                autoScroll      :true,
                border          :false,
                tbar            :tbar,
                items :[{
                    xtype           :'contestlist',
                    store           :me.store,
                    autoScroll      :true,
                    actionButtons   :Bozuko.beta?['report','edit','copy','delete','cancel']:null
                }]
            }]
        });

        me.callParent(arguments);
    }
});