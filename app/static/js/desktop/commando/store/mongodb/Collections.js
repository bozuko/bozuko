Ext.define('Commando.store.mongodb.Collections', {
    extend: 'Ext.data.Store',

    requires: ['Ext.data.reader.Json'],

    model: 'Commando.model.mongodb.Collection',

    autoLoad: false
});