Ext.define('Bozuko.view.chart.Basic', {
    
    extend : 'Ext.panel.Panel',
    alias : 'widget.bozukochartbasic',
    
    requires : [
        'Bozuko.lib.PubSub'
    ],
    
    totalsLabel : "Page Totals",
    
    formats : {
        'hour'  :'ga',
        'day'   :'d M',
        'week'  :'d M',
        'month' :'M Y',
        'year'  :'Y'
    },
    
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
            autoHeight: true,
            
            dateFormat: 'D M d',
            
            items : [{
                xtype           :'panel',
                border          :'false',
                anchor          :'0',
                layout          :'hbox',
                ref             :'chart-controls',
                items           :[{
                    xtype           :'combo',
                    hideLabel       :true,
                    forceSelection  :true,
                    editable        :false,
                    width           :120,
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
                            /*
                            {text:'Facebook Posts', value:'Share',fn:'sum'},
                            {text:'Share Clicks', value:'Share Clicks', fn:'sum'},
                            {text:'Share Clicks (Win)', value:'Share Clicks (Win)', fn:'sum'},
                            */
                            {text:'Game Shares', value:'Game Shares',fn:'sum'},
                            {text:'Win Shares', value:'Win Shares', fn:'sum'},
                            
                            {text:'Game Share Clicks', value:'Game Share Clicks',fn:'sum'},
                            {text:'Win Share Clicks', value:'Win Share Clicks', fn:'sum'},
                            
                            {text:'Total Prize Wins', value:'Prize',fn:'sum'},
                            {text:'Redeemed Prizes', value:'Redeemed Prizes',fn:'sum'},
                            {text:'Facebook Likes', value:'Likes',fn:'sum'},
                            {text:'Subscribers', value:'Optin',fn:'sum'},
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
                    ref             :'date-range',
                    xtype           :'fieldcontainer',
                    fieldLabel      :'Date Range',
                    labelWidth      :70,
                    width           :280,
                    border          :false,
                    layout          :'hbox',
                    defaults        :{
                        listeners       :{
                            select          :me.onDateChange,
                            scope           :me
                        }
                    },
                    items           :[{
                        xtype           :'datefield',
                        name            :'from_time',
                        value           :new Date(Date.now() - 1000*60*60*24*7),
                        dateFormat      :'d/m/Y',
                        editable        :false,
                        width           :95
                    },{xtype:'splitter'},{
                        xtype           :'datefield',
                        name            :'to_time',
                        value           :new Date(),
                        editable        :false,
                        dateFormat      :'d/m/Y',
                        width           :95
                    }]
                    
                },{
                    xtype           :'component',
                    flex            :1,
                    style           :'text-align:right; line-height: 20px; color: #666; font-size: 12px; font-weight: bold; font-family: Tahoma; padding-right: 10px;',
                    border          :false,
                    ref             :'chart-total'
                }]
            },{
                xtype           :'component',
                ref             :'stats-block',
                autoHeight      :true,
                tpl             :new Ext.XTemplate(
                    '<div class="stats-block">',
                        '<table class="main-table">',
                            '<tr><td colspan="3" style="padding: 0;"><h3>',me.totalsLabel,'</h3></td></tr>',
                            '<tr valign="top">',
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
                                                '<th>Male:</th>',
                                                '<td>{[this.commas(values.male)]} ({[parseInt(values.male/values.users*100)]}%)</td>',
                                            '</tr>',
                                            '<tr>',
                                                '<th>Female:</th>',
                                                '<td>{[this.commas(values.female)]} ({[parseInt(values.female/values.users*100)]}%)</td>',
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
            }, {
                xtype           :'panel',
                border          :false,
                style           :'text-align:center; margin-bottom: 10px;',
                anchor          :'0',
                autoHeight      :true,
                items           :[{
                    autoHeight      :true,
                    xtype           :'button',
                    text            :'Refresh Data',
                    scope           :this,
                    handler         :function(){
                        this.updateChart();
                        this.updateStats();
                    }
                }]
            },{
                xtype           :'panel',
                border          :false,
                style           :'text-align:center',
                anchor          :'0',
                autoHeight      :true,
                items           :[{
                    autoHeight      :true,
                    xtype           :'button',
                    hidden          : me.contest_id ? false : true,
                    text            :'Play Detail Report',
                    href            : Bozuko.Router.route('/contests/'+me.contest_id+'/report')
                }]
            },{
                xtype           :'panel',
                border          :false,
                style           :'text-align:center',
                anchor          :'0',
                autoHeight      :true,
                items           :[{
                    autoHeight      :true,
                    xtype           :'button',
                    hidden          : me.contest_id ? false : true,
                    text            :'Winners List',
                    href            : Bozuko.Router.route('/contests/'+me.contest_id+'/winnersReport')
                }]
            }]
        });
        
        me.callParent(arguments);
        
        me.on('render', me.renderChart, me, {delay:200});
    },
    
    onDateChange : function(){
        this.updateChart();
    },
    
    renderChart : function(){
        
        var me = this,
            chartCfg = {
                xtype: 'chart',
                border: false,
                theme : 'Bozuko',
                animate: true,
                height: 280,
                anchor: '0',
                
                store: Ext.create('Bozuko.store.Reports',{autoLoad:false}),
                axes: [{
                    type        :'Numeric',
                    position    :'left',
                    fields      :['count'],
                    title       :'Entries',
                    inflections :[],
                    grid: false /*{
                        odd: {
                            opacity: .5,
                            fill: '#ddd',
                            stroke: '#bbb',
                            'stroke-width': 1
                        }
                    } */,
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
                            var v = Ext.Date.format(storeItem.get('timestamp'),me.dateFormat)
                            this.setTitle(me.chartStore.getUnit().toLowerCase() == 'week' ? 'Week of '+v : v);
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
                    beforerefresh   :function(){
                        me.setDateFormat(me.chartStore.getUnit());
                    },
                    refresh         :me.onChartRefresh,
                    render          :me.onChartRefresh
                }
            };
            
        var i = me.items.indexOf(me.down('[ref=chart-controls]'));
        me.insert(i+1, chartCfg);
        
        if( me.contest && me.contest.get('engine_type') == 'time' && window.location.pathname.match(/\/admin/)){
            // add the redistirubtions
            i = me.items.indexOf(me.down('[ref=stats-block]'));
            me.insert(i, {
                ref             :'redistributions',
                xtype           :'component',
                html            :'<h3 style="text-align:center; color: black; font-size: 18px;"><span class="redistibutions">'+me.contest.get('redistributions')+'</span> Redistributions'
            });
        }
        
        // now we want to see if there are multiple places to filter
        if( me.contest && me.contest.get('page_ids') && me.contest.get('page_ids').length ){
            var dateRange = me.down('[ref=date-range]'),
                chartControls = me.down('[ref=chart-controls]'),
                j = chartControls.items.indexOf(dateRange)
                ;
                
            var filterPanel = me.insert(i, {
                xtype           :'combo',
                ref             :'page-filter',
                hideLabel       :true,
                forceSelection  :true,
                width           :250,
                editable        :false,
                value           :'',
                displayField    :'name',
                valueField      :'_id',
                store : Ext.create('Ext.data.Store', {
                    fields : ['name', '_id'],
                    proxy : {
                        type: 'rest',
                        url: Bozuko.Router.route('/contests/'+me.contest.get('_id')+'/pages'),
                        reader : {
                            type: 'json',
                            root: 'items',
                            getResponseData: function( response ){
                                var data = Ext.data.reader.Json.prototype.getResponseData.apply(this, arguments);
                                data.items.unshift({_id:'', name:'All Locations'});
                                return data;
                            }
                        }
                    },
                    autoLoad : true,
                    listeners :{
                        load : function(){
                            me.down('[ref=page-filter]').setValue('');
                        }
                    }
                }),
                listeners       :{
                    scope           :me,
                    select          :me.updateChart
                }
            });
        }
        
        me.chart = me.down('chart');
        me.chartStore = me.chart.store;
        me.chartProxy = me.chartStore.getProxy();
        // me.timeField = me.down('[name=time]');
        me.fromField = me.down('[name=from_time]');
        me.toField = me.down('[name=to_time]');
        me.modelField = me.down('[name=model]');
        
        me.toField.getPicker().on('show', function(){
            me.toField.setMaxValue( new Date() );
        });
        
        var filter = {};
        if( me.page_id ) filter.page_id = me.page_id;
        if( me.contest ) filter.contest_id = me.contest.get('_id');
        
        /*
        Bozuko.PubSub.subscribe('contest/entry', filter, me.getCallback('entry') );
        Bozuko.PubSub.subscribe('contest/play', filter, me.getCallback('play') );
        Bozuko.PubSub.subscribe('contest/win', filter, me.getCallback('win') );
        Bozuko.PubSub.subscribe('prize/redeemed', filter, me.getCallback('redeemed') );
        
        if( me.contest ) {
            Bozuko.PubSub.subscribe('contest/redistribute', filter, me.getCallback('redistribution') );
        }
        
        me.on('destroy', function(){
            Bozuko.PubSub.unsubscribe('contest/entry', filter, me.getCallback('entry') );
            Bozuko.PubSub.unsubscribe('contest/play', filter, me.getCallback('play') );
            Bozuko.PubSub.unsubscribe('contest/win', filter, me.getCallback('win') );
            Bozuko.PubSub.unsubscribe('prize/redeemed', filter, me.getCallback('redeemed') );
            if( me.contest ) {
                Bozuko.PubSub.unsubscribe('contest/redistribute', filter, me.getCallback('redistribution') );
            }
        });
        */
        
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
        me.updateChart();
        me.updateStats();
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
                },
                redistribution: function(item, callback){
                    callback();
                    me.down('[ref=redistributions]').getEl().down('.redistributions').update(item.redistributions);
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
        // set max min values...
        me.fromField.setMaxValue( me.toField.getValue() );
        me.toField.setMinValue( me.fromField.getValue() );
        me.chartProxy.extraParams = {
            from : me.fromField.getValue(),
            to: me.toField.getValue(),
            model : me.modelField.getValue(),
            timezoneOffset : (new Date()).getTimezoneOffset()
        };
        if( !me.contest_id && me.page_id ){
            me.chartProxy.extraParams.page_id = me.page_id;
        }
        if (me.contest_id ){
            me.chartProxy.extraParams.contest_id = me.contest_id;
        }
        if( me.down('[ref=page-filter]') ){
            var pf = me.down('[ref=page-filter]'),
                page_id;
                
            if( (page_id = pf.getValue()) ){
                me.chartProxy.extraParams.page_id = page_id;
            }
        }
        if( me.chart.axes.get(0).setTitle ){
            me.chart.axes.get(0).setTitle(me.modelField.getRawValue());
        }
        me.chartStore.load();
    },
    
    setDateFormat : function(unit){
        var me = this;
        me.dateFormat = me.formats[unit.toLowerCase()];
    }
    
});
