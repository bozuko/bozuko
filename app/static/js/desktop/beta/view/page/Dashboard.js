Ext.define('Beta.view.page.Dashboard', {
    
    alias: 'widget.pagedashboard',
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.lib.PubSub',
        'Beta.view.page.Chart'
    ],
    
    initComponent : function(){
        var me = this;
        
        
        Ext.define('Ext.chart.theme.Bozuko', {
            extend : 'Ext.chart.theme.Base',
            constructor : function(config){
                this.callParent([Ext.apply({
                    colors: ['#1db153','#33c667','#4ae07e']
                }, config)]);
            }
        });
        
        Ext.apply(me, {
            layout          :'border',
            items: [{
                region          :'east',
                style           :'border-left: 1px solid #ccc;',
                collapsible     :true,
                split           :true,
                frame           :false,
                title           :"Winners List - All Campaigns",
                xtype           :'winnerslist',
                width           :320,
                border          :false
            },{
                region          :'center',
                border          :false,
                autoScroll      :true,
                layout          :'anchor',
                bodyPadding     :10,
                items           :[{
                    xtype           :'form',
                    border          :false,
                    anchor          :'0',
                    defaults        :{
                        border          :false,
                        anchor          :'0',
                        labelAlign      :'left'
                    },
                    items           :[{
                        ref             :'statusField',
                        xtype           :'textarea',
                        name            :'status',
                        fieldLabel      :'Announcement'
                    }],
                    buttons         :[{
                        ref             :'updateStatus',
                        text            :'Update'
                    }]
                },{
                    xtype           :'component',
                    autoEl          :{
                        tag             :'h4',
                        cls             :'stats-heading',
                        html            :'Your Stats at a Glance'
                    }
                },{
                    xtype           :'pagechart',
                    anchor          :'0',
                    border          :false
                }]
            }]
        });
        
        me.callParent(arguments);
        var chart = me.down('[ref=dashboardchart]');
        Bozuko.PubSub.subscribe('contest/entry', {page_id: Bozuko.beta.page_id}, function(){
            chart.store.load();
        });
    }
    
});