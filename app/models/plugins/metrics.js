var Metrics = module.exports = function(schema, options){
    schema.static('updateMetrics', function(field, value) {
        console.log(this);
        var self = this;
        var date = new Date();
        var modifier = {$inc: {}};
        modifier.$inc[field+'.ct'] = 1;
        if (value) modifier.$inc[field+'.sum'] = value;
        
        var timestamp;
        switch(this.modelName) {
            case 'MetricsDaily':
                timestamp =  new Date(date.getFullYear(), date.getMonth(), date.getDate());
                break;
            case 'MetricsHourly':
                timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                    date.getHours());
                break;
            case 'MetricsMinutely':     
                timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                    date.getHours(), date.getMinutes());
                break;
        }

        return this.update(
            {timestamp: timestamp},
            modifier,
            {upsert: true},
            function(err) {
                if (err) console.error('Failed to update metrics: '+err);
            }
        );
    });
};
