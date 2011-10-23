Ext.define('Bozuko.view.chart.Basic', {
    
    extend : 'Ext.panel.Panel',
    alias : 'widget.bozukochartbasic',
    
    requires : [
        'Bozuko.lib.PubSub'
    ],
    
    totalsLabel : "Page Totals",
    
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
        
        if( me.contest_id ){
            me.totalsLabel = 'Campaign Totals';
        }
        else if( me.page_id ){
            me.totalsLabel = 'Account Totals';
        }
        else {
            me.totalsLabel = 'Overall Totals';
        }
        
        Ext.apply(me, {
            
            layout: 'anchor',
            
            dateFormat: 'D M d',
            
            items : [{
                xtype           :'panel',
                border          :'false',
                anchor          :'0',
                height          :30,
                layout          :'hbox',
                items           :[{xtype:'splitter', width: 60},{
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
                        fields          :['text','value','fn'],
                        data            :[
                            {text:'Entries', value:'Entry',fn:'sum'},
                            {text:'Plays', value:'Play',fn:'sum'},
                            {text:'Facebook Posts', value:'Share',fn:'sum'},
                            {text:'Total Prize Wins', value:'Prize',fn:'sum'},
                            {text:'Redeemed Prizes', value:'Redeemed Prizes',fn:'sum'},
                            {text:'Facebook Likes', value:'Likes',fn:'sum'},
                            {text:'Check Ins', value:'Checkins',fn:'sum'},
                            {text:'Unique Users', value:'Unique Users',fn:'average'},
                            {text:'New Users', value:'New Users',fn:'sum'},
                            {text:'Prize Cost', value:'Prize Cost',fn:'sum'}
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
                    width           :190,
                    
                    store           :Ext.create('Ext.data.Store',{
                        fields          :['text','value'],
                        data            :[
                            {text:'Last Minute (by Second)',    value:'minute-1'},
                            {text:'Last 10 Minutes (by Minute)', value:'minute-10'},
                            {text:'Last Day (by Hour)', value:'hour-24'},
                            {text:'Last Two Days (by Hour)', value:'hour-48'},
                            {text:'Last Week (by Day)', value:'week-1'},
                            {text:'Last Two Weeks (by Day)', value:'week-2'},
                            {text:'Last Month (by Day)', value:'week-4'},
                            {text:'Last 3 Months (by Week)', value:'month-3'},
                            {text:'Last 6 Months (by Month)', value:'month-6'},
                            {text:'Last Year (by Month)', value: 'month-12'},
                            {text:'Last 5 Years (by Year)', value: 'year-5'}
                        ]
                    }),
                    
                    listeners       :{
                        scope           :me,
                        change          :me.updateChart
                    }
                },{
                    xtype           :'component',
                    flex            :1,
                    style           :'text-align:right; line-height: 20px; color: #666; font-size: 12px; font-weight: bold; font-family: Tahoma; padding-right: 10px;',
                    border          :false,
                    ref             :'chart-total'
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
                    inflections :[],
                    grid: {
                        odd: {
                            opacity: .5,
                            fill: '#ddd',
                            stroke: '#bbb',
                            'stroke-width': 1
                        }
                    },
                    label:      {
                        renderer    :function(value){
                            if( me.modelField.getValue().match(/cost/i) ){
                                return Ext.util.Format.usMoney(value);
                            }
                            var axis = me.chart.axes.get(0);
                            return axis.roundToDecimal(value, axis.decimals);
                        }
                    },
                    minimum     :0
                },{
                    type        :'Category',
                    position    :'bottom',
                    fields      :'timestamp',
                    title       :'Time',
                    dateFormat  :'M d',
                    label       :{
                        renderer    :function(value){
                            return Ext.util.Format.date(value, me.dateFormat);
                        }
                    }
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
                            var count = me.modelField.getValue().match(/cost/i) ?
                                Ext.util.Format.usMoney(storeItem.get('count')) :
                                storeItem.get('count');
                            this.update( count+' '+me.modelField.getRawValue() );
                        }
                    },
                    axis: 'left',
                    xField: 'timestamp',
                    yField: 'count'
                }],
                listeners : {
                    scope           :me,
                    refresh         :me.onChartRefresh,
                    render          :me.onChartRefresh
                }
            },{
            
                xtype           :'component',
                ref             :'stats-block',
                tpl             :new Ext.XTemplate(
                    '<div class="stats-block">',
                        '<table class="main-table">',
                            '<tr><td colspan="3" style="padding: 0;"><h3>',me.totalsLabel,'</h3></td></tr>',
                            '<tr>',
                                '<td>',
                                    '<table>',
                                        '<thead>',
                                            '<tr valign="bottom">',
                                                '<th colspan="2">Users</th>',
                                            '</tr>',
                                        '</thead>',
                                        '<tbody>',
                                            '<tr>',
                                                '<th>Unique:</th>',
                                                '<td>{[this.commas(values.users)]}</td>',
                                            '</tr>',
                                            '<tr>',
                                                '<th>Entries:</th>',
                                                '<td>{[this.commas(values.entries)]}</td>',
                                            '<tr>',
                                                '<th>Plays:</th>',
                                                '<td>{[this.commas(values.plays)]}</td>',
                                            '</tr>',
                                        '</tbody>',
                                    '</table>',
                                '</td>',
                                '<td>',
                                    
                                    '<table>',
                                        '<thead>',
                                            '<tr valign="bottom">',
                                                '<th colspan="2">Facebook</th>',
                                            '</tr>',
                                        '</thead>',
                                        '<tbody>',
                                            '<tr>',
                                                '<th>Posts:</th>',
                                                '<td>{[this.commas(values.wallposts)]}</td>',
                                            '</tr>',
                                            '<tr>',
                                                '<th>Likes:</th>',
                                                '<td>{[this.commas(values.likes)]}</td>',
                                            '<tr>',
                                                '<th>Check Ins:</th>',
                                                '<td>{[this.commas(values.checkins)]}</td>',
                                            '</tr>',
                                        '</tbody>',
                                    '</table>',
                                '</td>',
                                '<td class="last-block">',
                                    '<table>',
                                        '<thead>',
                                            '<tr valign="bottom">',
                                                '<th colspan="2">Prizes</th>',
                                            '</tr>',
                                        '</thead>',
                                        '<tbody>',
                                            '<tr>',
                                                '<th>Won:</th>',
                                                '<td>{[this.commas(values.wins)]}</td>',
                                            '</tr>',
                                            '<tr>',
                                                '<th>Redeemed:</th>',
                                                '<td>{[this.commas(values.redeemed)]}</td>',
                                            '<tr>',
                                                '<th>Expired:</th>',
                                                '<td>{[this.commas(values.expired)]}</td>',
                                            '</tr>',
                                        '</tbody>',
                                    '</table>',
                                '</td>',
                            '</tr>',
                        '</table>',
                    '</div>',
                    {
                        commas : function(value){
                            return me.addCommas(value);
                        }
                    }
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
        
        me.on('destroy', function(){
            Bozuko.PubSub.unsubscribe('contest/entry', filter, me.getCallback('entry') );
            Bozuko.PubSub.unsubscribe('contest/play', filter, me.getCallback('play') );
            Bozuko.PubSub.unsubscribe('contest/win', filter, me.getCallback('win') );
            Bozuko.PubSub.unsubscribe('prize/redeemed', filter, me.getCallback('redeemed') );
        });
        
        me.chartStore.on('load', function(){
            var axis = me.chart.axes.get(0),
                redraw = false;
            
            var fn = me.modelField.store.findRecord('value', me.modelField.getValue()).get('fn') || 'sum';
            var total = me.chartStore[fn]('count');
            
            
            if( !total ){
                redraw = !axis.maximum;
                axis.maximum = 10;
            }
            else{
                redraw = axis.maximum;
                delete axis.maximum;
            }
            if( redraw ) me.chart.redraw();
            
            if( me.modelField.getValue().match(/cost/i)){
                total = Ext.util.Format.usMoney(total);
            }
            else{
                // is this not a whole number?
                if( total !== total.toFixed(1) ){
                    total = total.toFixed(2);
                }
                total = me.addCommas(total);
            }
            var drawStuff = function(){
                me.down('[ref=chart-total]').update('<span style="color: #000;">'+total+'</span> <span style="font-weight: normal;">'+(fn=='sum'?'total':fn)+' this time period</span>');
                if( total == 0 ){
                    if( !me.chart.rendered ) return;
                    if( !me.chartMask ){
                        me.chart.getEl().setStyle('position','relative');
                        me.chartMask = me.chart.getEl().createChild({
                            tag:'div',
                            cls:'chart-mask',
                            html: '<div class="bg"></div><div class="info"><div>There is no data to show for the chosen time period.</div></div>'
                        });
                        me.chartMask.setVisibilityMode( Ext.Element.DISPLAY );
                    }
                    me.chartMask.show();
                }
                else{
                    if( me.chartMask && me.chartMask.isVisible() ){
                        me.chartMask.hide();
                        me.chart.forceComponentLayout();
                    }
                }
            };
            if( me.chart.rendered ){
                drawStuff();
            }
            else me.chart.on('render', drawStuff);
            
        });
    },
    
    resume : function(){
        this.paused = false;
        this.updateChart();
        this.updateStats();
    },
    
    pause : function(){
        this.paused = true;
    },
    
    getCallback : function(name){
        var me = this,
            model = function(){ return me.modelField.getValue() }
            callbacks = {
                entry: function(item, callback){
                    callback();
                    if( !me.isVisible() ) return;
                    me.updateStats();
                    if( ~Ext.Array.indexOf(['Entry','Share','New Users','Unique Users'],model()) ) me.loadStore();
                },
                play : function(item, callback){
                    callback();
                    if( !me.isVisible() ) return;
                        
                    me.updateStats();
                    if( ~Ext.Array.indexOf(['Play'],model()) ) me.loadStore();
                },
                win : function(item, callback){
                    callback();
                    if( !me.isVisible() ) return;
                    if( ~Ext.Array.indexOf(['Prize'],model()) )me.loadStore();
                },
                redeemed : function(item, callback){
                    callback();
                    if( !me.isVisible() ) return;
                    me.updateStats();
                    if( ~Ext.Array.indexOf(['Redeemed Prizes', 'Share', 'Prize Cost'], model()) ) me.loadStore();
                }
            };
        return callbacks[name];
    },
    
    addCommas : function(nStr){
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    },
    
    onChartRefresh : function(){
        
    },
    
    loadStore : function(){
        var me  = this;
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
                me.up().doLayout();
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
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='M Y';
                }
            }
            else if( /month/i.test(time[0]) && time[1] > 1 ){
                if( time[1] == 3 ){
                    me.dateFormat = me.chart.axes.get(1).dateFormat='\\Week W';
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='M Y';
                }
            }
            else if( /day/i.test(time[0])){
                me.dateFormat = me.chart.axes.get(1).dateFormat='ga';
                
            }
            else if( /hour/i.test(time[0])){
                if( time[1] > 1 ){
                    me.dateFormat = me.chart.axes.get(1).dateFormat='ga';
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='g:i a';
                }
                
            }
            else if( /minute/i.test(time[0])){
                if( time[1] > 1 ){
                    me.dateFormat = me.chart.axes.get(1).dateFormat='g:ia';
                }
                else{
                    me.dateFormat = me.chart.axes.get(1).dateFormat='g:i:sa';
                }
            }
            else{
                me.dateFormat = me.chart.axes.get(1).dateFormat='d M';
            }
        }
        me.chartStore.load();
    }
    
});