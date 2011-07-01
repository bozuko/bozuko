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
        {name:'_id',                  type: 'String'},
        {name:'date',                 type:'Date'},
        {name:'db',                   type:'String'},
        {name:'objects',              type:'Number'},
        {name:'avgObjectSize',        type:'Number'},
        {name:'dataSize',             type:'Number'},
        {name:'storageSize',          type:'Number'},
        {name:'indexSize',            type:'Number'},
        {name:'fileSize',             type:'Number'}
    ]
});
