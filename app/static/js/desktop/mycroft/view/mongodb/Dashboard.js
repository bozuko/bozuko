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
        var now = new Date();

        var store = Ext.create('Mycroft.store.mongodb.Dbs', {autoLoad: true}),
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
                fields: 'date',
                title: 'Time',
                dateFormat: 'i:s',
                groupBy: 'minute,second',
//                constrain: true,
                majorTickSteps: 100,
                fromDate: now,
  //              toDate: new Date(now.getTime() + 120000),
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

        var ct = 0;
        setInterval(function() {
            tmpStore.load(function(records, operation, success) {
                console.log("success = "+success);
                if (!success) return console.error("Failed to load collection stats");
                console.log("records = "+records[0].raw);
                if (ct) {
                    store.add(records[0].raw);
                } else {
                    store.load();
                    ct++;
                }

                console.log("store.count = "+store.count());
            });

        }, 5000);
    }
});
