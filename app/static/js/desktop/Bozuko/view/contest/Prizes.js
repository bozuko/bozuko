Ext.define('Bozuko.view.contest.Prizes', {
    
    extend              :'Ext.grid.Panel',
    alias               :'widget.contestprizes',
    
    initComponent       :function(){
        var me = this;
        
        Ext.apply( me, {
            autoScroll      :true,
            store           :me.contest.prizes(),
            columns: [
                {header: 'Name',            dataIndex: 'name',          flex: 1},
                {header: 'Total Quantity',  dataIndex: 'total'},
                {header: 'Total Remaining', dataIndex: 'total',         renderer:me.renderers.remaining},
                {header: 'Won',             dataIndex: 'won'},
                {header: 'Active',          dataIndex: 'won',           renderer:me.renderers.active},
                {header: 'Redeemed',        dataIndex: 'redeemed'}
            ]
        });
            
        me.callParent(arguments);
    },
    
    renderers : {
        remaining : function(value, meta, record){
            return record.get('total') - record.get('won');
        },
        active : function(value, meta, record){
            return (record.get('won') - record.get('redeemed'))+'<sup>*</sup>';
        }
    }
    
});