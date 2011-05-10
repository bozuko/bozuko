Ext.define('Bozuko.view.page.add.Form' ,{
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.pageaddform',
    
    initComponent : function(){
        this.html = 'form';
        this.callParent( arguments );
    }
    
    // we need to add a google map after this fires
});