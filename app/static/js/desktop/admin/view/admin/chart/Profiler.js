Ext.define( 'Bozuko.view.admin.chart.Profiler', {
    extend: 'Ext.chart.Chart',
    alias: 'widget.profiler',
    
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
        fields: ['date'],
        title: 'Time',
        dateFormat: 'm-d-Y h:i a'
    }],
    series: [{
        type: 'column',
        axis: 'left',
        xField: 'date',
        yField: 'entries',
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
        type: 'column',
        axis: 'left',
        xField: 'date',
        yField: 'entries',
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