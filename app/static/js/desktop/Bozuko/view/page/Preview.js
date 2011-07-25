Ext.define( 'Bozuko.view.page.Preview', {
    extend          :'Ext.panel.Panel',
    alias           :'widget.pagepreview',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            width: 320,
            cls : 'page-preview',
            tpl : new Ext.XTemplate(Ext.fly('preview-tmpl').dom.innerHTML)
        });
        
        me.callParent( arguments );
        me.on('afterrender', me.fixImage, me);
        me.on('activate', me.fixImage, me);
    },
    
    update : function(){
        this.callParent( arguments );
        this.fixImage();
    },
    
    loadRecord : function(record){
        var data = {
            page: record.data
        };
        this.update( data );
    },
    
    fixImage : function(){
        // lets get that darn image.
        if( !this.getEl() ) return;
        var img = Ext.DomQuery.selectNode('.img img', this.getEl().dom);
        if( !img ) return;
        img = Ext.fly(img);
        img.setStyle({
            'margin-top': (-img.getHeight() / 2)+'px',
            'margin-left': (-img.getWidth() / 2)+'px'
        });
    }
});