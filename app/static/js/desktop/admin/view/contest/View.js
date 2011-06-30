Ext.define('Admin.view.contest.View' ,{
    
    extend: 'Ext.view.View',
    alias : 'widget.contestsview',
    
    requires : [
        'Bozuko.lib.PubSub'
    ],
    
    emptyText: 'No active campaigns.',
    deferEmptyText: false,
    cls: 'campaigns-body',
    
    itemSelector: '.list-item',
    itemOverCls : 'list-item-over',
    itemSelectedCls : 'list-item-selected',
    
    initComponent : function(){
        var me = this;
        
        me.tpl = new Ext.XTemplate(
            '<ul class="campaign-list">',
                '<tpl for=".">',
                    '<li class="list-item">',
                        '<h3 class="title">',
                            '<span class="state">',
                                '{[this.getState(values)]}',
                            '</span>',
                            '{[this.getTitle(values.name)]}',
                        '</h3>',
                        '<div class="details">',
                            '<tpl if="this.canReport(values)">',
                                '<div class="gauge"></div>',
                            '</tpl>',
                            '{[this.getDetails(values)]}',
                        '</div>',
                        '<ul class="buttons">',
                            '<tpl if="this.canReport(values)">',
                                '<li><a href="javascript:;" class="reports">Reports</a></li>',
                            '</tpl>',
                            '<tpl if="this.canEdit(values)">',
                                '<li><a href="javascript:;" class="edit">Edit</a></li>',
                            '</tpl>',
                            '<li><a href="javascript:;" class="copy">Copy</a></li>',
                            '<tpl if="this.canPublish(values)">',
                                '<li><a href="javascript:;" class="publish">Publish</a></li>',
                            '</tpl>',
                            '<tpl if="this.canDelete(values)">',
                                '<li><a href="javascript:;" class="delete">Delete</a></li>',
                            '</tpl>',
                            '<tpl if="this.canCancel(values)">',
                                '<li><a href="javascript:;" class="cancel">Cancel</a></li>',
                            '</tpl>',
                        '</ul>',
                    '</li>',
                '</tpl>',
            '</ul>',
            {
                
                canEdit : function(values){
                    return true || ~['draft', 'published'].indexOf(values.state);
                },
                
                canPublish : function(values){
                    return ~['draft'].indexOf(values.state);
                },
                
                canDelete : function(values){
                    return ~['draft','published'].indexOf(values.state);
                },
                
                canCancel : function(values){
                    return ~['active'].indexOf(values.state);
                },
                
                canReport : function(values){
                    return ~['active','complete','cancelled'].indexOf(values.state);
                },
                
                getTitle : function(name){
                    return name || 'Untitled Campaign';
                },
                
                getDetails: function(values){
                    return [
                        '<table cellpadding="0" cellspacing="0">',
                            '<tbody>',
                                '<tr>',
                                    '<th>Game:</th>',
                                    '<td>',
                                    values.game ? values.game.substr(0,1).toUpperCase()+values.game.substr(1) : 'Unknown',
                                    '<td>',
                                '<tr>',
                                '<tr>',
                                    '<th>Timeline:</th>',
                                    '<td>',
                                    Ext.isDate(values.start) && Ext.isDate(values.end)
                                        ? Ext.Date.format(values.start,'m/d/Y')+' - '+Ext.Date.format(values.end,'m/d/Y')
                                        : 'Unknown',
                                    '<td>',
                                '<tr>',
                                '<tr>',
                                    '<th>Number of Entries:</th>',
                                    '<td>',values.total_entries,'</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>'
                    ].join('');
                },
                
                getState : function( values ){
                    return values.state.substr(0,1).toUpperCase()+values.state.substr(1);
                }
            }
        );
        
        me.callParent();
        
        me.on('refresh', me.addGauges, me);
        me.on('destroy', me.destroyGauges, me);
        
    },
    
    addGauges : function(){
        var me = this;
        me.gauges = {};
        Ext.Array.each( me.getNodes(), function(node){
            var gauge = Ext.fly(node).down('.gauge');
            if( !gauge ) return;
            var record = me.getRecord(node);
            // else
            var percent = Math.max( 0, record.get('play_cursor')+1) / record.get('total_plays') * 100;
            if( isNaN( percent) ) percent = 0;
            
            me.gauges[record.get('_id')] = Ext.create('Ext.chart.Chart',{
                animate: true,
                style: 'background:transparent',
                width: 200,
                height: 130,
                renderTo: gauge,
                animate: true,
                store: Ext.create('Ext.data.Store',{
                    fields:['percent'],
                    data:[{percent: percent}]
                }),
                insetPadding: 25,
                flex: 1,
                axes: [{
                    type: 'gauge',
                    position: 'gauge',
                    minimum: 0,
                    maximum: 100,
                    steps: 10,
                    margin: 7
                }],
                series: [{
                    type: 'gauge',
                    field: 'percent',
                    donut: 50,
                    colorSet: ['#82B525', '#ddd']
                }]
            });
        });
    },
    
    destroyGauges : function(){
        var me = this;
        Ext.Object.each( me.gauges, function(key, gauge){
            gauge.destroy();
        });
    }
});