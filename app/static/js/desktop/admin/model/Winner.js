Ext.define('Bozuko.model.Winner', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/admin/winners',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'contest_id',         type:'String'},
        {name:'prize',              type:'Object'},
        {name:'user',               type:'Object'}
    ]
});