Ext.define('Bozuko.view.chart.Basic', {
    
    extend : 'Ext.panel.Panel',
    alias : 'widget.bozukochartbasic',
    
    requires : [
        'Bozuko.lib.PubSub'
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
                            {text:'Facebook Wall Posts', value:'Share'},
                            {text:'Total Prize Wins', value:'Prize'},
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
                            {text:'Last Minute', value:'minute-1'},
                            {text:'Last 10 Minutes', value:'minute-10'},
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
                border: false,
                theme : 'Bozuko',
                animate: true,
                height: 250,
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
                        width: 150,
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
        var filter = {};
        if( me.page_id ) filter.page_id = me.page_id;
        var model = function(){ return me.modelField.getValue() };
        Bozuko.PubSub.subscribe('contest/entry', filter, function(){
            if( ~['Entry','Share'].indexOf(model()) ) me.chart.store.load();
        });
        Bozuko.PubSub.subscribe('contest/play', filter, function(){
            if( ~['Play'].indexOf(model()) ) me.chart.store.load();
        });
        Bozuko.PubSub.subscribe('contest/win', filter, function(){
            if( ~['Prize'].indexOf(model()) ) me.chart.store.load();
        });
        Bozuko.PubSub.subscribe('prize/redeem', filter, function(){
            if( ~['Redeemed Prizes', 'Share'].indexOf(model()) ) me.chart.store.load();
        });
    },
    
    updateChart : function(){
        var me = this;
        me.chartProxy.extraParams = {
            time : me.timeField.getValue(),
            model : me.modelField.getValue(),
            timezoneOffset : (new Date()).getTimezoneOffset()
        };
        if( me.page_id ){
            me.chartProxy.extraParams.page_id = me.page_id;
        }
        if (me.contest_id ){
            me.chartProxy.extraParams.contest_id = me.contest_id;
        }
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
            else if( /minute/i.test(time[0])){
                if( time[1] > 1 ){
                    me.chart.axes.get(1).dateFormat='g:ia';
                    me.chart.axes.get(1).groupBy = 'year,month,day,hour,minute';
                }
                else{
                    me.chart.axes.get(1).dateFormat='g:i:sa';
                    me.chart.axes.get(1).groupBy = 'year,month,day,hour,minute,second';
                }
            }
            else{
                me.chart.axes.get(1).dateFormat='d M';
                me.chart.axes.get(1).groupBy = 'year,month,day';
            }
        }
        me.chartStore.load();
    }
    
});