Ext.define('Bozuko.model.Prize', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    fields: [
        {name:'_id',            type:'String'},
        {name:'value',          type:'Number'},
        {name:'duration',       type:'Number'},
        {name:'image',          type:'String'},
        {name:'name',           type:'String'},
        {name:'description',    type:'String'},
        {name:'details',        type:'String'},
        {name:'instructions',   type:'String'},
        {name:'image',          type:'String'},
        {name:'total',          type:'Number'},
        {name:'claimed',        type:'Number'}
    ],
    
    belongsTo: 'Bozuko.model.Contest'
});