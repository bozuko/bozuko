Ext.define( 'Bozuko.view.contest.Players', {
    alias : 'widget.contestplayers',
    extend : 'Ext.view.View',
    
    requires : [
        'Bozuko.model.User'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply( me, {
            
            store           :Ext.create('Ext.data.Store', {
                model           :'Bozuko.model.User',
                proxy           :{
                    type            :'rest',
                    url             :'/admin/players',
                    reader          :{
                        type            :'json',
                        root            :'items',
                        idProperty      :'entry_id'
                    }
                },
                autoLoad        :true
            }),
            
            cls             :'player-list',
            trackOver       :true,
            overItemCls     :'player-item-over',
            itemCls :       'player-item',
            
            itemTpl : new Ext.XTemplate(
                '<div class="ct">',
                    '<img src="{image}" alt="{name}" />',
                    '<span class="name"><a href="{facebook_link}" target="_blank">{name}</a></span>',
                '</div>'
            )
        });
        
        me.callParent(arguments);
    },
    
    prepareData : function(data, index, record){
        data.image = data.image.replace(/type=large/, 'type=square');
        data.facebook_link = record.raw.services[0].data.link;
        return data;
    }
});