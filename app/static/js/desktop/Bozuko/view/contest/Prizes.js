Ext.define('Bozuko.view.contest.Prizes', {
    
    extend              :'Ext.grid.Panel',
    alias               :'widget.contestprizes',
    
    initComponent       :function(){
        var me = this;
        me.prizes = me.contest.prizes();
        me.prizes.sort('value', 'DESC');
        Ext.apply( me, {
            autoScroll      :true,
            store           :me.prizes,
            columns: [
                {header: 'Name',            dataIndex: 'name',          flex: 1},
                {header: 'Value',           dataIndex: 'value',         width: 70,      renderer:me.renderers.value},
                {header: 'Total',           dataIndex: 'total',         width: 70},
                {header: 'Remaining',       dataIndex: 'total',         width: 70,      renderer:me.renderers.remaining},
                {header: 'Won',             dataIndex: 'won',           width: 70},
                {header: 'Active',          dataIndex: 'won',           width: 70,      renderer:me.renderers.active},
                {header: 'Expired',         dataIndex: 'won',           width: 70,      renderer:me.renderers.expired},
                {header: 'Redeemed',        dataIndex: 'redeemed',      width: 70}
            ]
        });
        me.callParent(arguments);
        // TODO - we should subscribe to wins / redemptions
        me.contest.on('update', me.getExpired, me);
        me.on('render', me.updateExpired, me);
        me.prizes.on('update', me.updateExpired, me);
    },
    
    renderers : {
        remaining : function(value, meta, record){
            return record.get('total') - record.get('won');
        },
        active : function(value, meta, record){
            var text = Ext.isDefined(record.active_count) ? record.active_count : 'Loading...';
            return '<div class="'+(record.get('_id')+'-active')+'">'+text+'</div>';
        },
        expired : function(value, meta, record){
            var text = Ext.isDefined(record.expired_count) ? record.expired_count : 'Loading...';
            return '<div class="'+(record.get('_id')+'-expired')+'">'+text+'</div>';
        },
        value : function(value){
            return '$'+value;
        }
    },
    
    updateExpired : function(){
        var me = this;
        Ext.Ajax.request({
            method: 'get',
            url : Bozuko.Router.route('/prizes/expired'),
            disableCaching: true,
            params: {
                contest_id: me.contest.get('_id')
            },
            callback : function(options, success, response){
                // decode the response
                var result = Ext.decode( response.responseText );
                // find and update
                me.prizes.each(function(prize){
                    // see what the deal is here...
                    var id = prize.get('_id'),
                        total = prize.get('total'),
                        expired = result[id],
                        active = prize.get('won') - expired - prize.get('redeemed')
                        ;
                    // find and update
                    prize.expired_count = expired;
                    prize.active_count = active;
                    me.getEl().down('.'+id+'-active').update(String(active));
                    me.getEl().down('.'+id+'-expired').update(String(expired));
                });
            }
        });
    }
    
});