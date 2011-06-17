Ext.define('Bozuko.view.page.add.Pages' ,{
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.pageaddlist',
    
    layout          :'fit',
    
    initComponent : function(){
        var me = this;
        
        me.addEvents({
            'selectplace': true
        });
        
        me.dockedItems = [{
            layout          :'anchor',
            bodyPadding     :5,
            border          :false,
            items: [{
                xtype           :'textfield',
                name            :'search',
                fieldLabel      :'Search for a Facebook Page',
                labelWidth      :180,
                enableKeyEvents :true,
                border          :'0 0 1 0',
                anchor          :'0',
                listeners       :{
                    keyup           :me.onKeyUp,
                    scope           :me
                }
            }]
        }];
        
        me.items = [{
            xtype           :'dataview',
            cls             :'bozuko-list',
            emptyText       :'Start typing above, if you already did, then we could not find nothing',
            deferEmptyText  :true,
            autoScroll      :true,
            itemTpl: new Ext.XTemplate(
                '<img src="{[this.getImage(values.image)]}" />',
                '<div class="title">{name}</div>',
                '<div class="sub">{category}</div>',
                '<div class="sub">{website}</div>',
                {
                    getImage: function(image){
                        return image.replace(/type=large/, 'type=square');
                    }
                }
            ),
            store: me.store,
            listeners: {
                scope           :me,
                selectionchange :me.onSelectionChange
            }
        }];
        
        me.bufferedSearch = Ext.create('Ext.util.DelayedTask', me.search, me);
        me.callParent( arguments );
    },
    
    onSelectionChange : function(view, selections){
        if( !selections.length ) return;
        this.fireEvent('selectplace', selections[0]);
    },
    
    onKeyUp : function(){
        this.bufferedSearch.delay(500);
    },
    
    search : function(){
        var me =this;
        
        me.store.load({
            filters: [{
                property: 'query',
                value: me.down('textfield[name=search]').getValue()
            }]
        });
    }
});