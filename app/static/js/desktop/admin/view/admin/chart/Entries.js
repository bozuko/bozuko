Ext.define( 'Bozuko.view.admin.chart.Entries', {
    extend: 'Ext.chart.Chart',
    alias: 'widget.entries',
    
    style: 'background:#fff',
    
    axes: [{
        type: 'Numeric',
        grid: true,
        position: 'left',
        fields: ['entries'],
        title: 'Entries',
        grid: {
            odd: {
                fill: '#dedede',
                stroke: '#ddd',
                'stroke-width': 0.5
            }
        }
    }, {
        type: 'Time',
        position: 'bottom',
        fields: 'date',
        title: 'Time',
        dateFormat: 'H:i:s',
        groupBy: 'year,month,day,hour,minute,second',
        aggregateOp: 'sum',

        constrain: true,
        fromDate: new Date(2011, 1, 1),
        toDate: new Date(2011, 1, 7)
    }],
    series: [{
        type: 'line',
        axis: 'left',
        xField: 'date',
        yField: 'visits',
        label: {
            display: 'none',
            field: 'visits',
            renderer: function(v) { return v >> 0; },
            'text-anchor': 'middle'
        },
        markerConfig: {
            radius: 5,
            size: 5
        }
    },{
        type: 'line',
        axis: 'left',
        xField: 'date',
        yField: 'views',
        label: {
            display: 'none',
            field: 'visits',
            renderer: function(v) { return v >> 0; },
            'text-anchor': 'middle'
        },
        markerConfig: {
            radius: 5,
            size: 5
        }
    },{
        type: 'line',
        axis: 'left',
        xField: 'date',
        yField: 'veins',
        label: {
            display: 'none',
            field: 'visits',
            renderer: function(v) { return v >> 0; },
            'text-anchor': 'middle'
        },
        markerConfig: {
            radius: 5,
            size: 5
        }
    }]
});