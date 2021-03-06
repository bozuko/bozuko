Ext.define('Admin.view.contest.report.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestreportpanel',
    
    requires: [
        'Admin.view.contest.report.Details',
        'Bozuko.view.contest.Players',
        'Bozuko.view.chart.Basic',
        'Bozuko.view.contest.Overview'
    ],
    
    layout: {
        type        :'border'
    },
    
    border : false,
    
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
                ref         :'details-label-text',
                text        :'Campaign Details:'
            },{
                xtype       :'tbtext',
                ref         :'details-campaign-text',
                text        :''
            }]
        });
        /*
        me.chartStore = Ext.create('Ext.data.Store', {
            fields: ['timestamp', 'count'],
            proxy: {
                type: 'rest',
                url: '/admin/entry'
            }
        });
        */
        
        me.items = [{
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
            contest_id      :me.record.get('_id'),
            region          :'east',
            width           :250,
            margin          :'2 2 2'
        }];
        me.callParent();
        if( me.record ) me.setRecord( me.record );
    },
    
    setRecord : function(record){
        var me = this;
        // set the record...
        me.down('contestoverview').update( record );
        // me.down('contestplayers').setContest( record );
        me.down('bozukochartbasic').contest_id = record.get('_id');
        me.down('[ref=details-campaign-text]').setText(record.get('name'));
        me.record = record;
        
    }
});