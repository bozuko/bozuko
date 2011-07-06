Ext.define('Beta.view.page.Chart', {
    
    extend : 'Ext.panel.Panel',
    alias : 'widget.pagechart',
    
    requires : [
        'Bozuko.lib.PubSub'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            
            layout: 'anchor',
            
            items : [{
                xtype           :'panel',
                border          :'false',
                anchor          :'0',
                layout          :'hbox',
                items           :[{
                    xtype           :'component',
                    flex            :1,
                    border          :false
                },{
                    xtype           :'combo',
                    hideLabel       :true,
                    style           :'margin-right: 10px;',
                    forceSelection  :true,
                    editable        :false,
                    name            :'model',
                    queryMode       :'local',
                    displayField    :'text',
                    value           :'Entry',
                    valueField      :'value',
                    store           :Ext.create('Ext.data.Store',{
                        fields          :['text','value'],
                        data            :[
                            {text:'Entries', value:'Entry'},
                            {text:'Plays', value:'Play'},
                            {text:'Won Prizes', value:'Prize'},
                            {text:'Redeemed Prizes', value:'Redeemed Prizes'}
                        ]
                    }),
                    listeners       :{
                        scope           :me,
                        change          :me.updateChart
                    }
                },{
                    xtype           :'combo',
                    hideLabel       :true,
                    forceSelection  :true,
                    editable        :false,
                    name            :'time',
                    queryMode       :'local',
                    displayField    :'text',
                    value           :'week-1',
                    valueField      :'value',
                    
                    store           :Ext.create('Ext.data.Store',{
                        fields          :['text','value'],
                        data            :[
                            {text:'Last Day', value:'day-1'},
                            {text:'Last Two Days', value:'day-2'},
                            {text:'Last Week', value:'week-1'},
                            {text:'Last Two Weeks', value:'week-2'},
                            {text:'Last Month', value:'month-1'}
                        ]
                    }),
                    
                    listeners       :{
                        scope           :me,
                        change          :me.updateChart
                    }
                }]
            },{
                xtype: 'chart',
                ref: 'dashboardchart',
                border: false,
                theme : 'Bozuko',
                animate: true,
                height: 300,
                anchor: '0',
                store: Ext.create('Bozuko.store.Reports'),
                axes: [{
                    type        :'Numeric',
                    position    :'left',
                    fields      :['count'],
                    title       :'Entries',
                    grid: {
                        odd: {
                            opacity: .5,
                            fill: '#ddd',
                            stroke: '#bbb',
                            'stroke-width': 1
                        }
                    },
                    minimum     :0
                },{
                    type        :'Time',
                    position    :'bottom',
                    fields      :'timestamp',
                    title       :'Time',
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
                            
                            this.setTitle(Ext.Date.format(storeItem.get('timestamp'),
                                (/day/i.test(me.timeField.getValue()) ?'ga':
                                    (/year/i.test(me.timeField.getValue()) ? 'M y' :
                                        'D M d'
                                    )
                                )
                            ));
                            this.update( storeItem.get('count')+' '+me.modelField.getRawValue() );
                        }
                    },
                    axis: 'left',
                    xField: 'timestamp',
                    yField: 'count'
                }]
            }]
        });
        
        me.callParent(arguments);
        me.chart = me.down('chart');
        me.chartStore = me.chart.store;
        me.chartProxy = me.chartStore.getProxy();
        me.timeField = me.down('[name=time]');
        me.modelField = me.down('[name=model]');
        me.updateChart();
        Bozuko.PubSub.subscribe('contest/entry', {page_id: me.page_id}, function(){
            if( me.modelField.getValue() == 'Entry' ) me.chart.store.load();
        });
        Bozuko.PubSub.subscribe('contest/play', {page_id: me.page_id}, function(){
            if( me.modelField.getValue() == 'Play' ) me.chart.store.load();
        });
        Bozuko.PubSub.subscribe('contest/win', {page_id: me.page_id}, function(){
            if( me.modelField.getValue() == 'Prize' ) me.chart.store.load();
        });
        Bozuko.PubSub.subscribe('prize/redeem', {page_id: me.page_id}, function(){
            if( me.modelField.getValue() == 'Redeemed Prizes' ) me.chart.store.load();
        });
    },
    
    updateChart : function(){
        var me = this;
        me.chartProxy.extraParams = {
            time : me.timeField.getValue(),
            model : me.modelField.getValue(),
            page_id : me.page_id
        };
        if( me.chart.axes.get(0).setTitle ){
            me.chart.axes.get(0).setTitle(me.modelField.getRawValue());
            var time = me.timeField.getValue().split('-');
            if( /year/i.test(time[0]) ){
                me.chart.axes.get(1).dateFormat='M y';
                me.chart.axes.get(1).groupBy = 'year,month';
            }
            else if( /day/i.test(time[0])){
                me.chart.axes.get(1).dateFormat='ga';
                me.chart.axes.get(1).groupBy = 'year,month,day,hour';
                
            }
            else{
                me.chart.axes.get(1).dateFormat='d M';
                me.chart.axes.get(1).groupBy = 'year,month,day';
            }
        }
        me.chartStore.load();
    }
    
});