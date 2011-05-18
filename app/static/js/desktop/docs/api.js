Ext.onReady(function(){
    
    // lets create a tree for the left panel
    var treePanel = Ext.create('Ext.tree.TreePanel',{
        autoScroll: true,
        region: 'west',
        width: 200,
        collapsible: false,
        split: true,
        animate: true,
        margins: '4 0 0 4',
        title: 'API Objects',
        rootVisible: false,
        store: Ext.create('Ext.data.TreeStore',{
            clearOnLoad: false,
            root: {
                text: 'Docs',
                id:'root',
                expanded: true,
                children:treeData
            }
        }),
        collapseFirst : false,
        listeners : {
            itemclick : function(view, record, tree){
                Ext.History.add(record.get('id'));
                openPage(record.get('id'), record.get('text'));
            }
        }
    });
    
    function onHistoryChange(token){
        var record = treePanel.store.getNodeById(token);
        openPage(record.get('id'), record.get('text') );
    }
    Ext.util.History.fieldId = 'x-history-field';
    Ext.util.History.iframeId = 'x-history-frame';
    var pages = {};
    function openPage(id, name){
        var parts = id.replace(/^\//,'').split('/');
        if( pages[id] ){
            tabPanel.setActiveTab(pages[id]);
            return pages[id];
        }
        pages[id] = tabPanel.add({
            title: name,
            autoDestroy: true,
            iconCls: parts[0]+'Icon',
            listeners: {
                removed : function(){
                    delete pages[id];
                }
            }
        });
        tabPanel.setActiveTab(pages[id]);
        pages[id].setLoading(true);
        Ext.Ajax.request({
            url: '/docs/api'+id,
            success : function(response){
                pages[id].update( response.responseText );
                var el = pages[id].getEl();
                pages[id].setLoading(false);
                if( parts[0] != 'objects') return;
                // lets look at the code and see if we need to make
                // links in the "json" object
                var code = el.down('.code');
                if( !code ) return;
                code.select('.expander').each(function(expander){
                    var trigger = expander.down('.trigger');
                    var content = expander.down('.content');
                    content.setVisibilityMode( Ext.Element.DISPLAY );
                    content.setVisible(false);
                    trigger.on('click', function(e){
                        e.stopEvent();
                        content.toggle();
                    });
                });
            }
        });
        return pages[id];
    }
    
    var tabPanel = new Ext.TabPanel({
        region : 'center',
        margins : '4 4 0 0',
        activeTab : 0,
        plain: true,
        enableTabScroll: true,
        plugins: [
            Ext.create('Ext.ux.TabCloseMenu')
        ],
        defaults: {
            cls: 'controller-page',
            padding: 10,
            closable: true,
            autoScroll: true,
            styleHtmlContent: true
        },
        items : [{
            title: 'Welcome',
            contentEl: 'welcome',
            closable: false
        }]
    });
    
    
    
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
        Ext.util.History.on('change',onHistoryChange);
    });
});
