Ext.define('Mycroft.store.mongodb.Collections', {
    extend: 'Ext.data.Store',

    requires: ['Ext.data.reader.Json'],

    model: 'Mycroft.model.mongodb.Collection',

    autoLoad: false
});