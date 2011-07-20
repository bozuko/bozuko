Ext.define('Bozuko.view.contest.Reports', {
    
    alias : 'widget.contestreports',
    extend : 'Ext.panel.Panel',
    
    requires : [
        'Bozuko.view.contest.Overview',
        'Bozuko.view.chart.Basic',
        'Bozuko.view.contest.Players'
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
                text            :'Back',
                action          :'back',
                icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-left-24.png'
            },' ',{
                xtype           :'tbtext',
                ref             :'details-label-text',
                text            :'Campaign Details:'
            },{
                xtype           :'tbtext',
                ref             :'details-campaign-text',
                text            :me.record.get('name')||'Untitled Campaign'
            }]
        });
        
        Ext.apply(me, {
            layout          :'border',
            items : [{
                record          :me.record,
                xtype           :'contestoverview',
                region          :'north',
                border          :false
            },{
                region          :'center',
                xtype           :'bozukochartbasic',
                contest_id      :me.record.get('_id'),
                border          :false,
                bodyPadding     :10,
                autoScroll      :true
            },{
                xtype           :'contestplayers',
                region          :'east',
                width           :250,
                margin          :'2 2 2',
                contest_id      :me.record.get('_id')
            }]
        });
        
        me.callParent( arguments );
    }
    
});