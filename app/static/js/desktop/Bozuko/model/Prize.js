Ext.define('Bozuko.model.Prize', {
    extend: 'Ext.data.Model',

    idProperty: '_id',

    fields: [
        {name:'_id',            type:'String'},
        {name:'value',          type:'Number'},
        {name:'duration',       type:'Number',  defaultValue: 1000 * 60 * 60},
        {name:'image',          type:'String'},
        {name:'name',           type:'String'},
        {name:'description',    type:'String'},
        {name:'details',        type:'String'},
        {name:'instructions',   type:'String'},
        {name:'image',          type:'String'},
        {name:'total',          type:'Number'},
        {name:'won',            type:'Number'},
        {name:'redeemed',       type:'Number'},
        {name:'is_email',       type:'Boolean'},
        {name:'is_barcode',     type:'Boolean'},
        {name:'barcodes',       type:'Array'},
        {name:'email_body',     type:'String'},
        {name:'email_codes',    type:'Array'}
    ],

    belongsTo: 'Bozuko.model.Contest'
});