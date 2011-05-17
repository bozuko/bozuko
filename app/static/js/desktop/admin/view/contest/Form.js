Ext.define('Bozuko.view.contest.Form' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestform',
    
    requires: [
        'Bozuko.view.contest.form.Details',
        'Bozuko.view.contest.form.Prizes'
    ],
    
    layout: 'fit',
    border: false,
    
    initComponent : function(){
        var me = this;
        
        me.items = [{
            xtype           :'tabpanel',
            activeTab       :0,
            items:[{
                title           :'Campaign',
                xtype           :'contestformdetails'
            },{
                title           :'Prizes',
                xtype           :'contestformprizes'
            },{
                title           :'Game'
            }]
        }];
        
        me.fbar = [{
            type            :'button',
            action          :'save',
            autoWidth       :true,
            text            :'Save'
        }];
        
        me.callParent();
    },
    
    setRecord : function(record){
        this.record = record;
        this.down('contestformprizes').bindStore( record.prizes() );
        this.down('contestformdetails').getForm().loadRecord( this.record );
    }
});