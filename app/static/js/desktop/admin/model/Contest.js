Ext.define('Bozuko.model.Contest', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    requires:[
        'Ext.ux.data.writer.JsonDeep'
    ],
    
    proxy: {
        type: 'rest',
        url: '/admin/contests',
        reader: {
            type: 'json',
            root: 'items'
        },
        writer: {
            type: 'jsondeep'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'page_id',            type:'String'},
        {name:'name',               type:'String'},
        {name:'engine_type',        type:'String'},
        {name:'game',               type:'String'},
        {name:'game_config',        type:'Object'},
        {name:'rules',              type:'String'},
        {name:'entry_config',       type:'Object'},        
        {name:'free_spins',         type:'Number'},
        {name:'active',             type:'Boolean'},
        {name:'state',              type:'String'},
        {name:'start',              type:'Date'},
        {name:'end',                type:'Date'},
        {name:'total_entries',      type:'Number'},
        {name:'total_plays',        type:'Number'},
        {name:'play_cursor',        type:'Number',              defaultValue:-1}
    ],
    
    hasMany: {model: 'Bozuko.model.Prize', name: 'prizes', associationKey: 'prizes'},
    
    autoLoad: true
});