Ext.define('Bozuko.view.page.Add' ,{
    
    extend          :'Ext.window.Window',
    alias           :'widget.pageadd',
    
    layout          :'border',
    
    requires        :[
        'Bozuko.view.page.add.Map',
        'Bozuko.view.page.add.Form'
    ],
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            region          :'center',
            store           :me.store,
            xtype           :'pageaddmap',
            border          :false
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
            'latlngchange': true,
            'selectplace': true
        });
        me.callParent( arguments );
        me.relayEvents( me.down('pageaddmap'), ['latlngchange','selectplace'] );
        me.on('selectplace', me.updateFormWithPlace, me );
    },
    
    updateFormWithPlace : function(place){
        var form = this.down('pageaddform');
        form.setPlace( place );
    }
});