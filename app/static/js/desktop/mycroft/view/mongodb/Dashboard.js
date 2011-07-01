Ext.define('Mycroft.view.mongodb.Dashboard', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.mongodbdashboard',

    title: "MongoDB Dashboard",

    layout: 'fit',

    requires: [
        'Mycroft.store.mongodb.Dbs'
    ],
    initComponent: function() {

        var tmpStore = Ext.create('Mycroft.store.mongodb.Dbs', {autoLoad: false});

        var store = Ext.create('Mycroft.store.mongodb.Dbs'),
        yFields = ['dataSize', 'storageSize'];
        this.items = [{
            xtype: 'chart',
            legend: {
                position: 'bottom'
            },
            store: store,
            axes: [{
                type: 'Numeric',
                position: 'left',
                fields: yFields,
                title: 'Memory/Storage (MB)',
                minimum: 0,
                grid: {
                    odd: {
                        fill: '#dedede',
                        stroke: '#ddd',
                        'stroke-width': 0.5
                    }
                }

            },{
                type: 'Time',
                position: 'bottom',
                fields: ['date'],
                title: 'Time',
                dateFormat: 'h:m:s',
                groupBy: 'year,month,day,hour,minute,second',
                aggregateOp: 'sum'
            }],
            series: [{
                type: 'line',
                title: 'dataSize',
                axis: 'left',
                xField: 'date',
                yField: 'dataSize',
                markerCfg: {
                    radius: 5,
                    size: 5
                }
            }, {
                type: 'line',
                title: 'storageSize',
                axis: 'left',
                xField: 'date',
                yField: 'storageSize',
                markerCfg: {
                    radius: 5,
                    size: 5
                }

            }]
        }];

        this.callParent();

        console.log("store.count = "+store.count());

        setInterval(function() {
            tmpStore.load(function(records, operation, success) {
                console.log("success = "+success);
                if (!success) return console.error("Failed to load collection stats");
                console.log("records = "+JSON.stringify(records[0].raw));
                store.add({
                    _id: records[0].raw._id,
                    storageSize: records[0].raw.storageSize,
                    dataSize: records[0].raw.dataSize,
                    date: records[0].raw.date
                });
                console.log("store.count = "+store.count());
            });

        }, 5000);
    }
});
