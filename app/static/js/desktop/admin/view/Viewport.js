Ext.define('Bozuko.view.Viewport' ,{
    extend: 'Ext.container.Viewport',
    title : 'Admin Container',
    requires: ['Bozuko.view.admin.Dashboard', 'Bozuko.view.page.List'],
    
    initComponent : function(){
        this.title = "Bozuko Admin";
        this.layout = 'border';
        this.border = false;
        
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
            region          :'west',
            xtype           :'pagelist',
            split           :true,
            width           :250,
            margin          :'2 0 2 2'
        },{
            xtype           :'tabpanel',
            region          :'center',
            plain           :true,
            margin          :'2 2 2 0',
            activeTab       :0,
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