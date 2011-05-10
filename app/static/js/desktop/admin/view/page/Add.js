Ext.define('Bozuko.view.page.Add' ,{
    
    extend          :'Ext.window.Window',
    alias           :'widget.pageadd',
    
    layout          :'border',
    
    requires        :[
        'Bozuko.view.page.add.Map',
        'Bozuko.view.page.add.Form'
    ],
    
    initComponent : function(){
        
        this.items = [{
            region          :'center',
            xtype           :'pageaddmap',
            border          :false
        },{
            region          :'east',
            xtype           :'pageaddform',
            width           :200
        }];
        
        this.buttons = [{
            text            :'Add'
        }];
        
        this.addEvents({
            'latlngchange': true
        })
        this.callParent( arguments );

        
        this.relayEvents( this.down('pageaddmap'), ['latlngchange'] );
    }
});