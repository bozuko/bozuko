Ext.define('Commando.model.mongodb.Collection', {
    extend: 'Ext.data.Model',

    idProperty: '_id',

    proxy: {
        type: 'rest',
        url: '/commando/mongodb/collections',
        reader: {
            type: 'json',
            root: 'collections'
        }
    },

    fields: [
        {name:'_id',                  type:'String'},
        {name:'date',                 type:'Date'},
        {name:'ns',                   type:'String'},
        {name:'count',                type:'Number'},
        {name:'size',                 type:'Number'},
        {name:'avgObjectSize',        type:'Number'},
        {name:'storageSize',          type:'Number'}
//        {name:'numExtents',           type:'Number'},
  //      {name:'lastExtentSize',       type:'Number'},
    //    {name:'paddingFactor',        type:'Number'},
      //  {name:'totalIndexSize',       type:'Number'}
    ]
});
