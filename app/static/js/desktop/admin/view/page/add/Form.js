Ext.define('Admin.view.page.add.Form' ,{
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.pageaddform',
    
    layout          :'fit',
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
            bodyPadding     :10,
            margin          :'0 0 4',
            tpl             :[
                '<tpl if="name">',
                    '<img src="{image}&type=square" height="80" style="float: left; margin: 0 10px 10px 0" />',
                    '<div style="font-weight: bold;">{name}</div>',
                    '<div>{category}</div>',
                    '<div>{location.city}, {location.state}</div>',
                '</tpl>',
                '<tpl if="!name">',
                    '<h3>Find a place or page in the left panel</h3>',
                '</tpl>'
            ]
        }];
        me.callParent( arguments );
    },
    
    setPlace : function(place){
        this.place = place;
        this.down('panel[region=north]').update( place.data );
        this.checkComplete();
    },
    
    checkComplete : function(){
        if( this.place ){
            this.fireEvent('allset');
        }
    }
    
});