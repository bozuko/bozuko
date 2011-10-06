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
                    '<div style="font-size: 14px; line-height: 1.4em;">',
                    '<p>You are currently enrolled in our beta program. ',
                    'Bozuko beta is totally free up to 2500 entries per month.  That\'s a lot of entries. ',
                    'If you are interested in new features or require more volume please contact ',
                    '<a href="mailto:info@bozuko.com">info@bozuko.com</a>.</p>',
                    '<p>Bozuko will provide 30 days notice before ending the beta program.  Have fun and good luck!</p>',
                    '</div>'
                ].join('')
            }]
            
        });
        
        me.callParent( arguments );
    }
    
});