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
            
            dateFormat: 'D M d',
            
            items : [{
                xtype           :'panel',
                border          :'false',
                anchor          :'0',
                layout          :'hbox',
                items           :[{
                    xtype           :'component',
                    flex            :1,
                    style           :'text-align:right; line-height: 20px; font-size: 18px; font-weight: bold;',
                    border          :false,
                    ref             :'chart-total'
                },{xtype:'splitter'},{
                    xtype           :'combo',
                    hideLabel       :true,
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
                            {text:'Redeemed Prizes', value:'Redeemed Prizes'},
                            {text:'Facebook Likes', value:'Likes'},
                            {text:'Check Ins', value:'Checkins'}
                        ]
                    }),
                    listeners       :{
                        scope           :me,
                        change          :me.updateChart
                    }
                },{xtype:'splitter'},{
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
                            {text:'Last Minute',    value:'minute-1'},
                            {text:'Last 10 Minutes', value:'minute-10'},
                            {text:'Last Day', value:'hour-24'},
                            {text:'Last Two Days', value:'hour-48'},
                            {text:'Last Week', value:'week-1'},
                            {text:'Last Two Weeks', value:'week-2'},
                            {text:'Last Month', value:'week-4'},
                            {text:'Last 6 Months', value:'month-6'},
                            {text:'Last Year', value: 'month-12'},
                            {text:'Last 5 Years', value: 'year-5'},
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
                height: 280,
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
                            this.setTitle(Ext.Date.format(storeItem.get('timestamp'),me.dateFormat));
                            this.update( storeItem.get('count')+' '+me.modelField.getRawValue() );
                        }
                    },
                    axis: 'left',
                    xField: 'timestamp',
                    yField: 'count'
                }],
                listeners : {
                    scope           :me,
                    refresh         :me.onChartRefresh
                }
            },{
                xtype           :'component',
                ref             :'stats-block',
                tpl             :new Ext.XTemplate(
                    '<div class="stats-block">',
                        '<table>',
                            '<thead>',
                                '<tr valign="bottom">',
                                    '<th>Users</th>',
                                    '<th>Likes</th>',
                                    '<th>Check Ins</th>',
                                    '<th>Wall Posts</th>',
                                    '<th>Entries</th>',
                                    '<th>Plays</th>',
                                    '<th>Wins</th>',
                                    '<th>Redeemed Prizes</th>',
                                    '<th>Expired Prizes</th>',
                                '</tr>',
                            '</thead>',
                            '<tbody>',
                                '<tr>',
                                    '<td>{users}</td>',
                                    '<td>{likes}</td>',
                                    '<td>{checkins}</td>',
                                    '<td>{wallposts}</td>',
                                    '<td>{entries}</td>',
                                    '<td>{plays}</td>',
                                    '<td>{wins}</td>',
                                    '<td>{redeemed}</td>',
                                    '<td>{expired}</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    '</div>'
                )
            }]
        });
        
        me.callParent(arguments);
        me.chart = me.down('chart');
        me.chartStore = me.chart.store;
        me.chartProxy = me.chartStore.getProxy();
        me.timeField = me.down('[name=time]');
        me.modelField = me.down('[name=model]');
        me.updateChart();
        me.updateStats();
        var filter = {};
        if( me.page_id ) filter.page_id = me.page_id;
        
        Bozuko.PubSub.subscribe('contest/entry', filter, me.getCallback('entry') );
        Bozuko.PubSub.subscribe('contest/play', filter, me.getCallback('play') );
        Bozuko.PubSub.subscribe('contest/win', filter, me.getCallback('win') );
        Bozuko.PubSub.subscribe('prize/redeemed', filter, me.getCallback('redeemed') );
    },
    
    getCallback : function(name){
        var me = this,
            model = function(){ return me.modelField.getValue() }
            callbacks = {
                entry: function(item, callback){
                    me.updateStats();
                    if( ~Ext.Array.indexOf(['Entry','Share'],model()) ) me.loadStore(callback);
                    else callback();
                },
                play : function(item, callback){
                    if( ~Ext.Array.indexOf(['Play'],model()) ) me.loadStore(callback);
                    else callback();
                },
                win : function(item, callback){
                    if( ~Ext.Array.indexOf(['Prize'],model()) )me.loadStore(callback);
                    else callback();
                },
                redeemed : function(item, callback){
                    me.updateStats();
                    if( ~Ext.Array.indexOf(['Redeemed Prizes', 'Share'], model()) ) me.loadStore(callback);
                    else callback();
                }
            };
        return callbacks[name];
    },
    
    onChartRefresh : function(){
        var me = this;
        // add up everything...
        var total = me.chartStore.sum('count');
        me.down('[ref=chart-total]').update(String(total));
    },
    
    loadStore : function(callback){
        var me  = this;
        if( callback ) callback();
        if( me.isLoading ){
            me.loadAgain = true;
            return;
        }
        me.isLoading = true;
        if( me.chart && me.chart.store ) me.chart.store.load(function(){
            me.isLoading = false;
            if( me.loadAgain ){
                me.loadAgain = false;
                me.loadStore();
            };
        });
    },
    
    updateStats : function(){
        var me = this;
        
        var req_opts = {
            method          :'GET',
            url             :Bozuko.Router.route('/stats'),
            params          :{}
        };
        if( me.page_id ){
            req_opts.params.page_id = me.page_id;
        }
        if( me.contest_id ){
            req_opts.params.contest_id = me.contest_id;
        }
        req_opts.success = function(response){
            try{
                var reports = Ext.decode( response.responseText );
                me.down('[ref=stats-block]').update( reports );
            }catch ( e ){
                
            }
        };
        Ext.Ajax.request(req_opts);
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
            time[1] = parseInt( time[1], 10 );
            if( /year/i.test(time[0]) ){
                if( time[1] > 1 ){
                    me.dateFormat = me.chart.axes.get(1).dateFormat='Y';
                    me.chart.axes.get(1).groupBy = 'year';
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='M Y';
                    me.chart.axes.get(1).groupBy = 'year,month';
                }
            }
            else if( /month/i.test(time[0]) && time[1] > 1 ){
                
                me.dateFormat = me.chart.axes.get(1).dateFormat='M Y';
                me.chart.axes.get(1).groupBy = 'year,month';
            }
            else if( /day/i.test(time[0])){
                
                me.dateFormat = me.chart.axes.get(1).dateFormat='ga';
                me.chart.axes.get(1).groupBy = 'year,month,day,hour';
                
            }
            else if( /hour/i.test(time[0])){
                if( time[1] > 1 ){
                    me.dateFormat = me.chart.axes.get(1).dateFormat='ga';
                    me.chart.axes.get(1).groupBy = 'year,month,day,hour';
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='g:i a';
                    me.chart.axes.get(1).groupBy = 'year,month,day,hour,minute';
                }
                
            }
            else if( /minute/i.test(time[0])){
                if( time[1] > 1 ){
                    me.dateFormat = me.chart.axes.get(1).dateFormat='g:ia';
                    me.chart.axes.get(1).groupBy = 'year,month,day,hour,minute';
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='g:i:sa';
                    me.chart.axes.get(1).groupBy = 'year,month,day,hour,minute,second';
                }
            }
            else{
                me.dateFormat = me.chart.axes.get(1).dateFormat='d M';
                me.chart.axes.get(1).groupBy = 'year,month,day';
            }
        }
        me.chartStore.load();
    }
    
});