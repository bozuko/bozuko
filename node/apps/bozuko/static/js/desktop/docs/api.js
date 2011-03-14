Ext.onReady(function(){
    
    // lets create a tree for the left panel
    var treePanel = new Ext.tree.TreePanel({
        autoScroll: true,
        region: 'west',
        width: 200,
        collapsible: false,
        split: true,
        animate: true,
        margins: '4 0 0 4',
        title: 'API Objects',
        rootVisible: false,
        loader: new Ext.tree.TreeLoader({
            preloadChildren: true,
            clearOnLoad: false
        }),
        root:new Ext.tree.AsyncTreeNode({
            text: 'Docs',
            id:'root',
            expanded: true,
            children:treeData
        }),
        collapseFirst : false,
        
        listeners : {
            click : function(node, tree){
                Ext.History.add(node.id);
                openPage(node.id, node.text);
            }
        }
    });
    
    function onHistoryChange(token){
        var node = treePanel.getNodeById(token);
        openPage(node.id, node.text);
    }
    Ext.History.on('change' ,onHistoryChange);
    
    
    var pages = {};
    function openPage(id, name){
        var parts = id.replace(/^\//,'').split('/');
        if( pages[id] ){
            tabPanel.setActiveTab(pages[id]);
            return pages[id];
        }
        pages[id] = tabPanel.add({
            title: name,
            iconCls: parts[0]+'Icon',
            listeners: {
                close : function(){
                    delete pages[id];
                }
            }
        });
        tabPanel.setActiveTab(pages[id]);
        pages[id].getUpdater().update({
            url: '/api'+id
        });
        return pages[id];
    }
    
    var tabPanel = new Ext.TabPanel({
        region : 'center',
        margins : '4 4 0 0',
        activeTab : 0,
        plugins: new Ext.ux.TabCloseMenu(),
        defaults: {
            cls: 'controller-page',
            padding: 10,
            closable: true,
            autoScroll: true,
            preventBodyReset: true
        },
        items : [{
            title: 'Welcome',
            contentEl: 'welcome',
            closable: false
        }]
    })
    
    var viewport = new Ext.Viewport({
        layout : 'border',
        cls:'api',
        items :[{
            cls:'header',
            height: 100,
            border: false,
            region:'north',
            html:[
                  '<h1 class="title"><span>API Documentation</span></h1>',
                  '<h2 class="confidential"><span class="big">Confidential</span><span class="smaller">Do not share</span></h2>'
            ]
        },treePanel,tabPanel]
    });
    
    Ext.History.init(function(){
        onHistoryChange(Ext.History.getToken());
    });
});