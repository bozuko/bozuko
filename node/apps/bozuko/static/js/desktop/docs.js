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
                var parts = node.id.split('-');
                var type = parts.shift();
                var name = parts.shift();
                
                var callback = function(controller){
                    switch( type ){
                        case 'controller':
                            controller.body.scrollTo('top',0,true);
                            break;
                        case 'route':
                        case 'method':
                            // scroll to route
                            var offset = Ext.get(node.id).getOffsetsTo(controller.body);
                            controller.body.scrollTo('top',offset[1]+controller.body.getScroll().top,true);
                            break;
                    }
                }
                
                var controller = openController(name, callback);
                
            }
        }
    });
    
    var controllers = {};
    function openController(name, callback){
        if( controllers[name] ){
            tabPanel.setActiveTab(controllers[name]);
            callback(controllers[name]);
            return controllers[name];
        }
        controllers[name] = tabPanel.add({
            title: name,
            iconCls:'controllerIcon',
            listeners: {
                close : function(){
                    delete controllers[name];
                }
            }
        });
        tabPanel.setActiveTab(controllers[name]);
        controllers[name].getUpdater().update({
            url: '/docs/page/'+name,
            callback: function(){
                callback.defer(10,this,[controllers[name]]);
            }
        });
        return controllers[name];
    }
    
    
    var tabPanel = new Ext.TabPanel({
        region : 'center',
        margins : '4 4 0 0',
        activeTab : 0,
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
});