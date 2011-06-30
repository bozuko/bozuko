Ext.define('Commando.view.mongodb.Dashboard', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.mongodbdashboard',

    title: "MongoDB Dashboard",

    layout: 'fit',

    requires: [
        'Commando.store.mongodb.Dbs'
    ],
    initComponent: function() {

        // var store = Ext.create('Ext.data.JsonStore', {
        //     fields: ['date', 'size', 'storageSize'],
        //     data: [
        //         {'date': new Date(2011, 1, 1), 'size': 50, 'storageSize': 70},
        //         {'date': new Date(2011, 1, 2), 'size': 70, 'storageSize': 70},
        //         {'date': new Date(2011, 1, 3), 'size': 88, 'storageSize': 120},
        //         {'date': new Date(2011, 1, 4), 'size': 100, 'storageSize': 120},
        //         {'date': new Date(2011, 1, 5), 'size': 140, 'storageSize': 180},
        //         {'date': new Date(2011, 1, 6), 'size': 160, 'storageSize': 180},
        //         {'date': new Date(2011, 1, 7), 'size': 220, 'storageSize': 300}
        //     ]
        // });

        var tmpStore = Ext.create('Commando.store.mongodb.Dbs', {autoLoad: false});

        var store = Ext.create('Commando.store.mongodb.Dbs'),
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
                dateFormat: 'Y-m-d h:m:s',
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
        setInterval(function() {
            tmpStore.load(function(records, operation, success) {
                console.log("records = "+JSON.stringify(records[0].raw));
                console.log("success = "+success);
                if (!success) return console.error("Failed to load collection stats");
                store.add({storageSize: records[0].raw.storageSize/1000000,
                           dataSize: records[0].raw.dataSize/1000000,
                           date: records[0].raw.date});
                console.log("store.count = "+store.count());
            });

        }, 5000);
    }
});
