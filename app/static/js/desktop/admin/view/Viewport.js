Ext.define('Admin.view.Viewport' ,{
    extend: 'Ext.container.Viewport',
    title : 'Admin Container',
    requires: [
        'Admin.view.admin.Dashboard',
        'Admin.view.page.List',
        'Admin.view.user.List',
        'Ext.ux.tab.plugin.CloseMenu'
    ],
    
    layout: 'border',
    border: false,
    
    initComponent : function(){
        
        this.items = [{
            layout          :'absolute',
            border          :'false',
            region          :'north',
            cls             :'header',
            contentEl       :'header',
            items           :[{
                style           :'z-index:1; right: 10px; top: 32px;',
                xtype           :'button',
                text            :'Logout'
            }]
        },{
            xtype           :'tabpanel',
            activeTab       :0,
            region          :'west',
            split           :true,
            width           :250,
            margin          :'2 0 2 2',
            collapsible     :true,
            items :[{
                xtype           :'pagelist'
            },{
                xtype           :'userlist'
            }]
        },{
            xtype           :'tabpanel',
            region          :'center',
            plain           :true,
            margin          :'2 2 2 0',
            activeTab       :0,
            plugins         :[{
                ptype           :'tabclosemenu'
            }],
            defaults        :{
                border          :'0 1 1 1'
            },
            items           :[{
                xtype: 'admindashboard'
            }]
        }];
        this.callParent();
    }
});