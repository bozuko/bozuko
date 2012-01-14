Ext.define('Bozuko.model.Report', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    fields: [
        {name:'_id',        type:'String'},
        {name:'timestamp',  type:'Date',        dateFormat:'c'},
        {name:'count',      type:'Number',      defaultValue: 0}
    ]
});