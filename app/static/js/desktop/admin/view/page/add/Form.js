Ext.define('Bozuko.view.page.add.Form' ,{
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.pageaddform',
    
    layout          :'border',
    margin          :'4',
    border          :false,
    defaults        :{
        border          :true
    },
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            region          :'north',
            title           :'Choose Place',
            data            :{},
            height          :126,
            bodyPadding     :10,
            margin          :'0 0 4',
            tpl             :[
                '<tpl if="name">',
                    '<img src="{image}&type=square" height="80" style="float: left; margin: 0 10px 10px 0" />',
                    '<div style="font-weight: bold;">{name}</div>',
                    '<div>{category}</div>',
                '</tpl>',
                '<tpl if="!name">',
                    '<h3>Find a place or page in the left panel</h3>',
                '</tpl>'
            ]
        },{
            region          :'center',
            title           :'Select the Owner',
            margin          :'0 0 0 0',
            autoScroll      :true,
            items           :[{
                xtype           :'dataview',
                store           :me.store,
                overItemCls     :'list-item-over',
                selectedItemCls :'list-item-selected',
                itemSelector    :'.list-item',
                emptyText       :'No Pages',
                tpl             :[
                    '<div class="bozuko-list">',
                        '<tpl for=".">',
                            '<div class="list-item">',
                                '<img src="{image}&type=square" />',
                                '<span class="title">{name}</span>',
                            '</div>',
                        '</tpl>',
                    '</div>'
                ],
                listeners       :{
                    scope           :me,
                    select          :function(view, user){
                        me.setUser( user );
                    }
                }
            }]
        }];
        me.callParent( arguments );
    },
    
    setPlace : function(place){
        this.place = place;
        this.down('panel[region=north]').update( place.data );
        this.checkComplete();
    },
    
    setUser : function(user){
        this.user = user;
        this.checkComplete();
    },
    
    checkComplete : function(){
        if( this.user && this.place ){
            this.fireEvent('allset');
        }
    }
    
});