Ext.define('Mycroft.store.mongodb.Dbs', {
    extend: 'Ext.data.Store',

    requires: ['Ext.data.reader.Json'],

    model: 'Mycroft.model.mongodb.Db',

    autoLoad: false
});