Ext.define('Admin.view.page.Add' ,{
    
    extend          :'Ext.window.Window',
    alias           :'widget.pageadd',
    
    layout          :'border',
    
    requires        :[
        'Admin.view.page.add.Map',
        'Admin.view.page.add.Pages',
        'Admin.view.page.add.Form'
    ],
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            region          :'center',
            xtype           :'tabpanel',
            activeTab       :0,
            border          :false,
            items: [{
                title           :'By Location',
                store           :me.placesStore,
                xtype           :'pageaddmap',
                border          :false
            },{
                xtype           :'pageaddlist',
                title           :'By Page',
                store           :me.pagesStore,
                border          :false
            }]
        },{
            region          :'east',
            xtype           :'pageaddform',
            store           :me.usersStore,
            width           :300,
            listeners       :{
                'allset'        :function(){
                    me.down('button[action=add]').enable();
                }
            }
        }];
        
        me.buttons = [{
            text            :'Add',
            action          :'add',
            disabled        :true
        }];
        
        me.addEvents({
            'latlngchange'  :true,
            'selectplace'   :true
        });
        me.callParent( arguments );
        me.relayEvents( me.down('pageaddmap'), ['latlngchange','selectplace'] );
        me.relayEvents( me.down('pageaddlist'), ['selectplace'] );
        me.on('selectplace', me.updateFormWithPlace, me );
    },
    
    updateFormWithPlace : function(place){
        var form = this.down('pageaddform');
        form.setPlace( place );
    }
});