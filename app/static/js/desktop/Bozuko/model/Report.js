Ext.define('Bozuko.model.Report', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/admin/report',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        {name:'_id',        type:'String'},
        {name:'timestamp',  type:'Date'},
        {name:'count',      type:'Number',      defaultValue: 0}
    ]
});