Ext.define('Bozuko.controller.Pages' ,{
    extend: 'Ext.app.Controller',
    
    views: ['page.Panel','page.Add'],
    stores: ['Pages'],
    models: ['Page'],
    
    refs : [
        {ref: 'pageData', selector: 'pagelist dataview'},
        {ref: 'tabPanel', selector: 'viewport tabpanel'},
    ],
    
    init : function(){
        this._tabs = {};
        this.control({
            'pagelist dataview':{
                itemclick: this.onPageClick
            },
            'pagelist button[action=add]':{
                click: this.addPage
            }
        });
    },
    
    onLaunch: function(){
        
        var store = this.getPagesStore(),
            dataview = this.getPageData();
            
        dataview.bindStore( store );
    },
    
    addPage : function(){
        // open the add window
        var me = this;
        if( !this._addWindow ){
            this._addWindow = Ext.create( 'Bozuko.view.page.Add', {
                title: 'Add a Business Page',
                width: 800,
                height: 600,
                listeners: {
                    close : function(){
                        delete me._addWindow;
                    },
                    latlngchange : function(center){
                        // do a place search...
                        console.log(center)
                    }
                }
            });
        }
        this._addWindow.show();
    },
    
    onPageClick : function(view, record){
        // need to open a new tab with the business page
        var id = record.get('_id'),
            me = this;
        if( !this._tabs[id] ){
            
            var panel = Ext.create('Bozuko.view.page.Panel', {
                record: record,
                closable: true,
                page_id: id,
                title: record.get('name'),
                listeners: {
                    destroy: function(){
                        delete me._tabs[id];
                    }
                }
            });
            me.getTabPanel().add( panel );
            me._tabs[id] = panel;
            this.initPagePanel( panel, record );
        }
        me.getTabPanel().setActiveTab( me._tabs[id] );
    },
    
    initPagePanel : function( panel, record ){
        var form = panel.down('pageform'),
            saveBtn = form.down('button[action=save]');
            
        form.loadRecord( record );
        saveBtn.on('click', function(){
            this.savePage(form);
        }, this);
        
    },
    
    savePage : function( form ){
        // update the record...
        var saveBtn = form.down('button[action=save]');
        var values = form.getForm().getValues();
        Ext.Object.each( values, function(key, value){
            var parts = key.split('.');
            if( parts.length == 1 ) return;
            var cur = values;
            while( parts.length > 1 ){
                var part = parts.shift();
                if( !cur[part] ) cur[part] = {};
                cur = cur[part];
            }
            cur[parts.shift()] = value;
        });
        form.record.set(values);
        form.record.commit();
        saveBtn.disable();
        form.record.save({
            success: function(){
                saveBtn.enable();
            },
            failure: function(){
                alert('Error Saving Page');
                saveBtn.enable();
            }
        });
    }
});