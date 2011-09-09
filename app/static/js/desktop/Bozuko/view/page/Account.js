Ext.define('Bozuko.view.page.Account' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pageaccount',
    
    autoScroll      :true,
    
    initComponent : function(){
        var me = this;
        
        Ext.apply( me, {
            
            bodyPadding         :10,
            
            items : [{
                xtype               :'component',
                autoEl              :{tag:'h3',cls:'page-h3'},
                html                :'Account'
            },{
                xtype               :'component',
                html                :[
                    '<p>You are currently enrolled in our invitation only program.</p>',
                    '<p>Thank you for participating - we are looking forward to your feedback!</p>'
                ].join('')
            }]
            
        });
        
        me.callParent( arguments );
    }
    
});