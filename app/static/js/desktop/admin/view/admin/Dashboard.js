Ext.define('Bozuko.view.admin.Dashboard' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.admindashboard',
    
    initComponent : function(){
        this.title = "Admin Dashboard";
        this.html = 'The admin dashboard';
        this.bodyPadding = 10;
        this.callParent();
    }
});