Ext.define('Beta.view.page.Dashboard', {
    
    alias: 'widget.pagedashboard',
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.lib.PubSub'
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
                width           :250,
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
                        text            :'Update Announcement'
                    }]
                },{
                    xtype: 'chart',
                    ref: 'entrychart',
                    border: false,
                    animate: true,
                    height: 300,
                    anchor: '0',
                    store: Ext.create('Bozuko.store.Reports',{autoload: true}),
                    axes: [{
                        type        :'Numeric',
                        position    :'left',
                        fields      :['count'],
                        title       :'Entries',
                        grid        :true,
                        minimum     :0
                    },{
                        type        :'Time',
                        position    :'bottom',
                        fields      :'timestamp',
                        title       :'Day',
                        dateFormat  :'M d',
                        groupBy     :'year,month,day'
                    }],
                    series: [{
                        title: 'Count',
                        type: 'column',
                        tips: {
                            trackMouse: true,
                            width: 80,
                            height: 50,
                            renderer: function(storeItem, item) {
                                this.setTitle(Ext.Date.format(storeItem.get('timestamp'), 'D M d'));
                                this.update( storeItem.get('count')+' Entries' );
                            }
                        },
                        axis: 'left',
                        xField: 'timestamp',
                        yField: 'count'
                    }]
                }]
            }]
        });
        
        me.callParent(arguments);
        var chart = me.down('[ref=entrychart]');
        Bozuko.PubSub.subscribe('contest/entry', {page_id: Bozuko.beta.page_id}, function(){
            chart.store.load();
        });
    }
    
});