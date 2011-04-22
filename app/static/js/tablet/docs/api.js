
Ext.setup({
    onReady: function() {
        // we have to convert the treeData to a nested list
        var data = [];
        function convertTree(tree,list){
            tree.forEach(function(node){
                var item = {
                    text : node.text,
                    id: node.id
                };
                if( node.leaf ){
                    item.leaf = true;
                }
                if( node.children ){
                    item.items = [];
                    // top level
                    node.children.unshift({
                        id: node.id,
                        text: node.text+' Overview',
                        leaf: true
                    });
                    convertTree(node.children, item.items);
                }
                list.push(item);
            });
        }
        treeData.unshift({
            text: "Documentation Intro",
            id: '/',
            leaf: true
        });
        convertTree(treeData, data);
        Ext.regModel('ListItem', {
            fields: [{name: 'text', type: 'string'}, {name:'id', type:'string'}]
        });
        
        var store = new Ext.data.TreeStore({
            model: 'ListItem',
            root: {text:"Docs", items:data},
            proxy: {
                type: 'ajax',
                reader: {
                    type: 'tree',
                    root: 'items'
                }
            }
        });
        var nestedList = new Ext.NestedList({
            title: 'Docs',
            displayField: 'text',
            store: store,
            dock: 'left',
            width: 300
        });
        
        nestedList.on('leafitemtap', function(list, i, el, e, detailCard) {
            var r = list.getRecord(el);
            changePage(r);
        });
        
        function changePage(r){
            if( typeof r == 'string'){
                console.log(r);
                r = store.getRootNode().findChild('id', r, true).getRecord();
            }
            var id = r.get('id');
            if( id == '/'){
                panel.update( welcome.dom.innerHTML );
                titleBar.setTitle(r.get('text'));
            }
            else Ext.Ajax.request({
                url: '/docs/api'+r.get('id'),
                success : function(response){
                    panel.update( response.responseText );
                    titleBar.setTitle(r.get('text'));
                }
            });
        }
        
        window.onhashchange = function(){
            var id = window.location.hash.substr(1);
            changePage(id);
        };
        
        var titleBar = new Ext.Toolbar({
            ui: 'dark',
            dock: 'top',
            title: 'Welcome'
        });
        
        var welcome = Ext.get('welcome');
        
        var panel = new Ext.Panel({
            fullscreen: true,
            bodyPadding: 20,
            styleHtmlContent: true,
            dockedItems: [nestedList, titleBar],
            scroll: 'vertical'
        });
        
        changePage('/');
        
    }
});