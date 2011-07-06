Ext.define('Beta.view.page.Dashboard', {
    
    alias: 'widget.pagedashboard',
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.lib.PubSub',
        'Bozuko.view.chart.Basic'
    ],
    
    initComponent : function(){
        var me = this;
        
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
                    xtype           :'bozukochartbasic',
                    anchor          :'0',
                    border          :false,
                    page_id         :Bozuko.beta.page_id
                }]
            }]
        });
        
        me.callParent(arguments);
    }
    
});