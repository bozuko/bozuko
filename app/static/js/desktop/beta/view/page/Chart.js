Ext.define('Beta.view.page.Chart', {
    
    extend : 'Ext.panel.Panel',
    alias : 'widget.pagechart',
    
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
                            {text:'Wall Posts', value:'Posts'}
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
                            {text:'Last Week', value:'week-1'},
                            {text:'Last Month', value:'month-1'},
                            {text:'Last Year', value:'year-1'},
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
        });
        
        me.callParent(arguments);
        me.chart = me.down('chart');
        me.chartStore = me.chart.store;
        me.chartProxy = me.chartStore.getProxy();
        me.timeField = me.down('[name=time]');
        me.modelField = me.down('[name=model]');
        me.updateChart();
    },
    
    updateChart : function(){
        var me = this;
        me.chartProxy.extraParams = {
            time : me.timeField.getValue(),
            model : me.modelField.getValue()
        };
        if( me.chart.axes.get(0).setTitle )
            me.chart.axes.get(0).setTitle(me.modelField.getRawValue());
        me.chartStore.load();
    }
    
});