Ext.define('Bozuko.view.contest.Reports', {
    
    alias : 'widget.contestreports',
    extend : 'Ext.panel.Panel',
    
    requires : [
        'Bozuko.view.contest.Overview',
        'Bozuko.view.contest.Prizes',
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
                xtype           :'tabpanel',
                border          :false,
                activeTab       :0,
                defaults        :{
                    border          :false
                },
                items           :[{
                    xtype           :'bozukochartbasic',
                    title           :'Performance',
                    contest_id      :me.record.get('_id'),
                    bodyPadding     :10,
                    autoScroll      :true
                },{
                    title           :'Prizes',
                    xtype           :'contestprizes',
                    contest         :me.record
                },{
                    title           :'Review',
                    xtype           :'contestreview',
                    contest         :me.record,
                    bodyPadding     :20,
                    autoScroll      :true
                }]
            },{
                xtype           :'contestplayers',
                region          :'east',
                style           :'border-right-width: 0 !important',
                width           :320,
                margin          :'0 0 0 2',
                contest_id      :me.record.get('_id')
            }]
        });
        
        me.callParent( arguments );
    }
    
});