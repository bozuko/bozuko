Ext.define('Bozuko.view.contest.report.Panel' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestreportpanel',
    
    requires: [
        'Bozuko.view.contest.report.Details',
        'Bozuko.view.winners.List'
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
        
        me.items = [{
            xtype           :'contestdetails',
            region          :'north',
            html            :'Contest Details',
            border          :false
        },{
            region          :'center',
            html            :'Main Report',
            border          :false
        },{
            xtype           :'winnerslist',
            region          :'east',
            width           :250,
            margin          :'0 2 2',
            title           :'Winners List'
        }];
        me.callParent();
    },
    
    setRecord : function(record){
        var me = this;
        // set the record...
        me.down('contestdetails').update( record.data );
        me.down('winnerslist').setContest( record );
        me.down('[ref=details-campaign-text]').setText(record.get('name'));
        me.record = record;
        
    }
});