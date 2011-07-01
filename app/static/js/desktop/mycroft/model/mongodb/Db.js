Ext.define('Mycroft.model.mongodb.Db', {
    extend: 'Ext.data.Model',

    idProperty: '_id',

    proxy: {
        type: 'rest',
        url: '/mycroft/mongodb/db',
        reader: {
            type: 'json',
            root: 'db_stats'
        }
    },

    fields: [
        {name:'db',                   type:'String'},
        {name:'collections',          type:'Number'},
        {name:'objects',              type:'Number'},
        {name:'avgObjectSize',        type:'Number'},
        {name:'dataSize',             type:'Number'},
        {name:'storageSize',          type:'Number'},
        {name:'numExtents',           type:'Number'},
        {name:'indexes',              type:'Number'},
        {name:'indexSize',            type:'Number'},
        {name:'fileSize',             type:'Number'},
        {name:'ok',                   type:'Number'},
        {name:'_id',                  type: 'String'},
        {name:'date',                 type:'Date'}
    ]
});
